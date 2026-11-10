/// <reference lib="deno.ns" />

import { handleDonationWebhook } from './handler.ts';

Deno.serve(handleDonationWebhook);
