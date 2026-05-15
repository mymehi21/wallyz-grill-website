# Supabase Secrets — Required Setup

Go to Supabase Dashboard → Edge Functions → Secrets and add these:

## Oak Park
- CLOVER_MERCHANT_ID_OAKPARK = JKK2PQSFMZNS1
- CLOVER_API_TOKEN_OAKPARK = 74ced84f-11bc-7103-0bdd-4da52e7e0842
- CLOVER_ECOMM_TOKEN_OAKPARK = [current HOSTED_CHECKOUT token from Clover dashboard]

## Redford
- CLOVER_MERCHANT_ID_REDFORD = G6JZKQKPDNT71
- CLOVER_API_TOKEN_REDFORD = b92256f2-54bd-75d3-394e-f13c76b59ae4
- CLOVER_ECOMM_TOKEN_REDFORD = [current HOSTED_CHECKOUT token from Clover dashboard]

## Supabase (auto-set by Supabase, no action needed)
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

IMPORTANT: Never put these values in source code or git.
After adding secrets, redeploy both functions:
  supabase functions deploy create-clover-order
  supabase functions deploy verify-payment
