/// <reference lib="deno.ns" />

import { handleDonationAlerts } from './handler.ts';

Deno.serve(handleDonationAlerts);
