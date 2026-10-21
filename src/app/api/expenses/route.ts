import { NextResponse } from 'next/server';
import { Storage } from '@/lib/db/storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    const expenses = await Storage.getExpenses(date);
    return NextResponse.json({ success: true, expenses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, description, amount, paymentMethod = 'CASH', bankAccountId, receiptAttachment, addedBy, userRole, date } = body;

    if (!category || !description || !amount) {
      return NextResponse.json({ error: 'Category, description, and amount are required' }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    if ((paymentMethod === 'CARD' || paymentMethod === 'ONLINE') && !bankAccountId) {
      return NextResponse.json(
        { error: 'Please select a company bank account for Card or Bank Transfer payment' },
        { status: 400 }
      );
    }

    // Auto-generate sequential Expense ID: EXP0001, EXP0002, etc.
    const allExpenses = await Storage.getExpenses();
    let maxNum = 0;
    allExpenses.forEach((e: any) => {
      const match = (e.expenseId || '').match(/EXP-?(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    const generatedId = `EXP${String(nextNum).padStart(4, '0')}`;
    const expenseId = body.expenseId && /^EXP\d{4,}$/i.test(body.expenseId) ? body.expenseId.toUpperCase() : generatedId;

    const expenseDate = date || new Date().toISOString().split('T')[0];

    let bankAccountName = '';
    // If paid via Company Card or Bank Transfer, adjust bank balance and log bank transaction
    if ((paymentMethod === 'CARD' || paymentMethod === 'ONLINE') && bankAccountId) {
      const bankAccount = await Storage.getBankAccountById(bankAccountId);
      if (!bankAccount) {
        return NextResponse.json({ error: 'Selected bank account was not found' }, { status: 400 });
      }

      bankAccountName = `${bankAccount.bankName} (${bankAccount.accountNumber})`;
      const updatedAcc = await Storage.adjustBankBalance(bankAccountId, -numAmount);

      await Storage.saveBankTransaction({
        transactionId: `TXN-EXP-${Date.now().toString().slice(-6)}`,
        accountId: bankAccountId,
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber,
        type: 'EXPENSE',
        amount: numAmount,
        balanceAfter: Number(updatedAcc?.balance ?? bankAccount.balance),
        reference: expenseId,
        description: `Expense [${category}]: ${description}`,
        performedBy: addedBy || 'Cashier',
        date: expenseDate,
        createdAt: new Date(),
      });
    }

    const newExpense = {
      expenseId,
      date: expenseDate,
      category,
      description,
      amount: numAmount,
      paymentMethod,
      bankAccountId: bankAccountId || '',
      bankAccountName,
      receiptAttachment: receiptAttachment || '',
      addedBy: addedBy || 'Cashier',
      status: 'ACTIVE',
    };

    await Storage.saveExpense(newExpense);

    await Storage.logAudit({
      user: addedBy || 'Cashier',
      role: userRole || 'CASHIER',
      action: 'EXPENSE_RECORDED',
      module: 'Expenses',
      recordId: expenseId,
      previousValue: '',
      newValue: `Rs.${numAmount} (${category}) via ${paymentMethod}${bankAccountName ? ' - ' + bankAccountName : ''}`,
      details: description,
    });

    return NextResponse.json({ success: true, expense: newExpense }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { expenseId, category, description, amount, paymentMethod = 'CASH', bankAccountId, receiptAttachment, updatedBy, userRole, date } = body;

    if (!expenseId) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    if (!category || !description || !amount) {
      return NextResponse.json({ error: 'Category, description, and amount are required' }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    if ((paymentMethod === 'CARD' || paymentMethod === 'ONLINE') && !bankAccountId) {
      return NextResponse.json(
        { error: 'Please select a company bank account for Card or Bank Transfer payment' },
        { status: 400 }
      );
    }

    const allExpenses = await Storage.getExpenses();
    const existing = allExpenses.find((e: any) => e.expenseId === expenseId);
    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Revert previous bank deduction if previous was bank/card
    if ((existing.paymentMethod === 'CARD' || existing.paymentMethod === 'ONLINE') && existing.bankAccountId) {
      await Storage.adjustBankBalance(existing.bankAccountId, Number(existing.amount));
    }

    let bankAccountName = '';
    // Apply new bank deduction if new is bank/card
    if ((paymentMethod === 'CARD' || paymentMethod === 'ONLINE') && bankAccountId) {
      const bankAccount = await Storage.getBankAccountById(bankAccountId);
      if (!bankAccount) {
        return NextResponse.json({ error: 'Selected bank account was not found' }, { status: 400 });
      }

      bankAccountName = `${bankAccount.bankName} (${bankAccount.accountNumber})`;
      const updatedAcc = await Storage.adjustBankBalance(bankAccountId, -numAmount);

      await Storage.saveBankTransaction({
        transactionId: `TXN-EXP-${Date.now().toString().slice(-6)}`,
        accountId: bankAccountId,
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber,
        type: 'EXPENSE',
        amount: numAmount,
        balanceAfter: Number(updatedAcc?.balance ?? bankAccount.balance),
        reference: expenseId,
        description: `Expense Edited [${category}]: ${description}`,
        performedBy: updatedBy || 'Admin',
        date: date || existing.date,
        createdAt: new Date(),
      });
    }

    const updates = {
      date: date || existing.date,
      category,
      description,
      amount: numAmount,
      paymentMethod,
      bankAccountId: bankAccountId || '',
      bankAccountName,
      receiptAttachment: receiptAttachment !== undefined ? receiptAttachment : (existing.receiptAttachment || ''),
    };

    const updated = await Storage.updateExpense(expenseId, updates);

    await Storage.logAudit({
      user: updatedBy || 'Admin',
      role: userRole || 'ADMIN',
      action: 'EXPENSE_UPDATED',
      module: 'Expenses',
      recordId: expenseId,
      previousValue: `Rs.${existing.amount} (${existing.category})`,
      newValue: `Rs.${numAmount} (${category}) via ${paymentMethod}${bankAccountName ? ' - ' + bankAccountName : ''}`,
      details: description,
    });

    return NextResponse.json({ success: true, expense: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get('expenseId');
    const deletedBy = searchParams.get('deletedBy') || 'Admin';
    const userRole = searchParams.get('userRole') || 'ADMIN';

    if (!expenseId) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    const allExpenses = await Storage.getExpenses();
    const existing = allExpenses.find((e: any) => e.expenseId === expenseId);
    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // If paid via bank/card, refund the bank balance
    if ((existing.paymentMethod === 'CARD' || existing.paymentMethod === 'ONLINE') && existing.bankAccountId) {
      const bankAccount = await Storage.getBankAccountById(existing.bankAccountId);
      const updatedAcc = await Storage.adjustBankBalance(existing.bankAccountId, Number(existing.amount));
      if (bankAccount) {
        await Storage.saveBankTransaction({
          transactionId: `TXN-REF-${Date.now().toString().slice(-6)}`,
          accountId: existing.bankAccountId,
          bankName: bankAccount.bankName,
          accountNumber: bankAccount.accountNumber,
          type: 'DEPOSIT',
          amount: Number(existing.amount),
          balanceAfter: Number(updatedAcc?.balance ?? bankAccount.balance),
          reference: expenseId,
          description: `Reversal for deleted expense: ${existing.category} - ${existing.description}`,
          performedBy: deletedBy,
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date(),
        });
      }
    }

    await Storage.deleteExpense(expenseId);

    await Storage.logAudit({
      user: deletedBy,
      role: userRole,
      action: 'EXPENSE_DELETED',
      module: 'Expenses',
      recordId: expenseId,
      previousValue: `Rs.${existing.amount} (${existing.category}) - ${existing.description}`,
      newValue: 'DELETED',
      details: `Expense ${expenseId} was deleted`,
    });

    return NextResponse.json({ success: true, message: `Expense ${expenseId} deleted successfully` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
