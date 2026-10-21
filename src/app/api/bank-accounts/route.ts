import { NextResponse } from 'next/server';
import { Storage } from '@/lib/db/storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId') || undefined;

    const [accounts, transactions] = await Promise.all([
      Storage.getBankAccounts(),
      Storage.getBankTransactions(accountId),
    ]);

    const totalBankBalance = accounts.reduce(
      (sum: number, acc: any) => sum + Number(acc.balance || 0),
      0
    );

    return NextResponse.json({
      success: true,
      accounts,
      transactions: transactions.slice(0, 50),
      totalBankBalance,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action = 'CREATE', performedBy = 'Admin' } = body;

    if (action === 'CREATE') {
      const { bankName, accountName, accountNumber, branch, initialBalance = 0 } = body;

      if (!bankName || !accountNumber || !branch) {
        return NextResponse.json(
          { error: 'Bank name, account number, and branch are required' },
          { status: 400 }
        );
      }

      const existingAccounts = await Storage.getBankAccounts();
      const duplicate = existingAccounts.find((a: any) => a.accountNumber === accountNumber);
      if (duplicate) {
        return NextResponse.json(
          { error: `Account number ${accountNumber} is already registered.` },
          { status: 400 }
        );
      }

      const count = existingAccounts.length + 1;
      const accountId = `BANK-${String(count).padStart(3, '0')}`;

      const newAccount = {
        accountId,
        bankName,
        accountName: accountName || `${bankName} Operating`,
        accountNumber,
        branch,
        balance: Number(initialBalance) || 0,
        isDefault: existingAccounts.length === 0,
        status: 'ACTIVE',
      };

      await Storage.saveBankAccount(newAccount);

      if (Number(initialBalance) > 0) {
        await Storage.saveBankTransaction({
          transactionId: `TXN-${Date.now()}`,
          accountId,
          bankName,
          accountNumber,
          type: 'DEPOSIT',
          amount: Number(initialBalance),
          balanceAfter: Number(initialBalance),
          reference: 'INITIAL-BALANCE',
          description: 'Initial account opening balance',
          performedBy,
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date(),
        });
      }

      await Storage.logAudit({
        user: performedBy,
        role: 'ADMIN',
        action: 'BANK_ACCOUNT_CREATED',
        module: 'Banking & Treasury',
        recordId: accountId,
        previousValue: '',
        newValue: `${bankName} (${accountNumber}) - Rs.${initialBalance}`,
        details: `Registered business bank account at ${branch}`,
      });

      return NextResponse.json({ success: true, account: newAccount }, { status: 201 });
    }

    if (action === 'DEPOSIT') {
      // Cash Drawer / Surplus Deposit into Bank
      const { accountId, amount, reference, description } = body;
      if (!accountId || !amount || Number(amount) <= 0) {
        return NextResponse.json({ error: 'Valid account and positive amount required' }, { status: 400 });
      }

      const account = await Storage.getBankAccountById(accountId);
      if (!account) {
        return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
      }

      const numAmount = Number(amount);
      const updatedAccount = await Storage.adjustBankBalance(accountId, numAmount);
      const newBalance = Number(updatedAccount?.balance ?? (Number(account.balance) + numAmount));

      const txnId = `TXN-DEP-${Date.now().toString().slice(-6)}`;
      const txn = {
        transactionId: txnId,
        accountId,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        type: 'DEPOSIT',
        amount: numAmount,
        balanceAfter: newBalance,
        reference: reference || 'CASH-DEPOSIT',
        description: description || 'Cash drawer funds deposited to bank',
        performedBy,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date(),
      };

      await Storage.saveBankTransaction(txn);

      await Storage.logAudit({
        user: performedBy,
        role: 'ADMIN',
        action: 'CASH_DEPOSITED_TO_BANK',
        module: 'Banking & Treasury',
        recordId: txnId,
        previousValue: `Balance: Rs.${account.balance}`,
        newValue: `Balance: Rs.${newBalance} (+Rs.${numAmount})`,
        details: `Deposited Rs.${numAmount} cash into ${account.bankName} (${account.accountNumber})`,
      });

      return NextResponse.json({ success: true, account: updatedAccount, transaction: txn });
    }

    if (action === 'WITHDRAW') {
      const { accountId, amount, reference, description } = body;
      const numAmount = Number(amount);
      const account = await Storage.getBankAccountById(accountId);
      if (!account) return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });

      if (Number(account.balance) < numAmount) {
        return NextResponse.json(
          { error: `Insufficient bank balance. Current balance is Rs.${account.balance}` },
          { status: 400 }
        );
      }

      const updatedAccount = await Storage.adjustBankBalance(accountId, -numAmount);
      const newBalance = Number(updatedAccount?.balance ?? (Number(account.balance) - numAmount));

      const txnId = `TXN-WTH-${Date.now().toString().slice(-6)}`;
      const txn = {
        transactionId: txnId,
        accountId,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        type: 'WITHDRAWAL',
        amount: numAmount,
        balanceAfter: newBalance,
        reference: reference || 'BANK-WITHDRAWAL',
        description: description || 'Cash withdrawal for shop operations',
        performedBy,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date(),
      };

      await Storage.saveBankTransaction(txn);

      return NextResponse.json({ success: true, account: updatedAccount, transaction: txn });
    }

    return NextResponse.json({ error: 'Invalid action requested' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
