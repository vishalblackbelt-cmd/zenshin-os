import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // 1. Verify the webhook secret to ensure the request actually came from your Google Form
    const authHeader = request.headers.get('authorization');
    const secret = process.env.WEBHOOK_SECRET; 

    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized request' }, { status: 401 });
    }

    // 2. Parse the incoming data
    const data = await request.json();
    const { studentName, branch, amountPaid, paymentDate, transactionRef } = data;

    // 3. Validate required fields
    if (!studentName || !amountPaid) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 4. Execute your database logic here
    console.log(`Processed fee: ₹${amountPaid} for ${studentName} (${branch})`);

    // 5. Send success response back to Google Apps Script
    return NextResponse.json({ success: true, message: 'Synced to Zenshin OS successfully' }, { status: 200 });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
