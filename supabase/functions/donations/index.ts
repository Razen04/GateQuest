/// <reference lib="deno.ns" />
import { handleVerifyDonations } from './handler.ts';

Deno.serve(handleVerifyDonations);
