/**
 * Sample email bodies for parser tests.
 * All PII masked: account numbers, names, UTRs, balances.
 */

export const REAL_SAMPLE_MASKED = `Dear Customer,

Thanking you for banking with Canara Bank.

An amount of INR 140.00 has been CREDITED on 05/07/26 to your account  XXXX0201 from NAME with UPI Ref No.:XXXXXXXX7979. Total Available Balance INR XX,XXX.50.If you are not expecting this credit or suspect any fraudulent activity, please contact: 18001030


This is an auto generated mail`;

export const REAL_SAMPLE_FULL_UTR = `Dear Customer,

Thanking you for banking with Canara Bank.

An amount of INR 169.00 has been CREDITED on 06/07/26 to your account  XXXX0201 from NAME with UPI Ref No.:421234567890. Total Available Balance INR XX,XXX.50.If you are not expecting this credit or suspect any fraudulent activity, please contact: 18001030


This is an auto generated mail`;

export const DEBIT_EMAIL = `Dear Customer,

Thanking you for banking with Canara Bank.

An amount of INR 50.00 has been DEBITED on 05/07/26 to your account  XXXX0201 from NAME with UPI Ref No.:421999999999. Total Available Balance INR XX,XXX.50.If you are not expecting this debit or suspect any fraudulent activity, please contact: 18001030


This is an auto generated mail`;

export const LARGE_AMOUNT_WITH_COMMAS = `Dear Customer,

Thanking you for banking with Canara Bank.

An amount of INR 1,40,000.00 has been CREDITED on 05/07/26 to your account  XXXX0201 from NAME with UPI Ref No.:421234567890. Total Available Balance INR XX,XXX.50.


This is an auto generated mail`;

export const HTML_WRAPPED = `
<html><body>
<div>Dear Customer,</div>
<div>Thanking you for banking with Canara Bank.</div>
<div>An amount of INR 140.00 has been CREDITED on 05/07/26 to your account&nbsp;XXXX0201 from NAME with UPI Ref No.:421234567890.</div>
</body></html>`;

export const MISSING_UTR = `Dear Customer,

Thanking you for banking with Canara Bank.

An amount of INR 140.00 has been CREDITED on 05/07/26 to your account  XXXX0201 from NAME. Total Available Balance INR XX,XXX.50.


This is an auto generated mail`;

export const PROMOTIONAL = `Dear Customer,

Canara Bank wishes you a happy Diwali! Explore our new credit card offers
and fixed deposit plans with attractive interest rates.

Visit canarabank.com to know more.

This is an auto generated mail`;

export const NOT_CANARA = `Your order has been shipped. Track it at amazon.in/xyz123.
Questions? Contact support@amazon.in`;

export const WHITESPACE_VARIATIONS = `Dear  Customer,

Thanking   you for banking  with  Canara  Bank.

An  amount  of  INR  140.00  has  been  CREDITED  on  05/07/26
to  your  account  XXXX0201  from  NAME  with  UPI  Ref  No.:421234567890.
Total Available Balance  INR  XX,XXX.50.

This is an auto generated mail`;

export const MULTILINE_BROKEN = `Dear Customer,
Thanking you for banking with Canara Bank.
An amount of INR 140.00 has
been CREDITED on 05/07/26 to your account XXXX0201 from NAME
with UPI Ref No.:421234567890.
Total Available Balance INR XX,XXX.50.`;
