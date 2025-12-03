import { beforeEach, describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { supabase } from '../../utils/supabaseClient.ts';
import { useDonations } from '../../hooks/useDonations.ts';

vi.mock('../../utils/supabaseClient.ts', () => ({
    supabase: {
        rpc: vi.fn(),
        from: vi.fn(),
    },
}));

// Helper for mockResolvedValue

function mockRpc<T>(data: T, error: any = null) {
    // eslint-disable-line
    return {
        data,
        error,
        status: error ? 400 : 200,
        statusText: error ? 'Error' : 'OK',
        count: null,
    };
}

describe('useDonations hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // loadDonations tests
    describe('loadDonations tests', () => {
        it('should initialize with default state and load donations successfully', async () => {
            // Creating a mock supabase to return 2 sample donations
            const sampleDonations = [
                {
                    donation_id: 1,
                    user_id: null,
                    anonymous: false,
                    message: 'Stop it',
                    actual_amount: 100,
                    verified: true,
                    created_at: new Date(),
                    user_name: null,
                    avatar: null,
                },
                {
                    donation_id: 2,
                    user_id: 1,
                    anonymous: false,
                    message: 'Stop it for godsake.',
                    actual_amount: 69,
                    verified: true,
                    created_at: new Date(),
                    user_name: 'Razen',
                    avatar: '',
                },
                {
                    donation_id: 3,
                    user_id: 2,
                    anonymous: true,
                    message: 'Stop it for godsake.',
                    actual_amount: 69,
                    verified: true,
                    created_at: new Date(),
                    user_name: 'Razen',
                    avatar: '',
                },
            ];

            // Mock supabase
            const mockedSupabase = vi.mocked(supabase);

            mockedSupabase.rpc.mockResolvedValue(mockRpc(sampleDonations));

            // Act: Render hook
            const { result } = renderHook(() => useDonations());

            // Assetion: Checking default values
            expect(result.current.donations).toEqual([]);
            expect(result.current.loading).toBe(false);

            // Act: Call loadDonations
            await act(async () => {
                await result.current.loadDonations();
            });

            // Assert after loading
            expect(supabase.rpc).toHaveBeenCalledWith('get_verified_donations');
            expect(result.current.donations).toHaveLength(3);

            // Checking formatting logic
            expect(result.current.donations[0]!.user_name).toBe('Anonymous');
            expect(result.current.donations[1]!.user_name).toBe('Razen');
            expect(result.current.donations[2]!.user_name).toBe('Anonymous');

            expect(result.current.loading).toBe(false);
        });

        it('handles errors when Supabase RPC fails in loadDonations()', async () => {
            // Mock supabase
            const mockedSupabase = vi.mocked(supabase);

            mockedSupabase.rpc.mockResolvedValue(mockRpc(null, 'RPC ERROR!'));

            // Spy on console.error (so we can assert it was called)
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { result } = renderHook(() => useDonations());

            // Assertion: Checking deafault values
            expect(result.current.donations).toEqual([]);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBe(false);

            // Calling the loadDonations
            await act(async () => {
                await result.current.loadDonations();
            });

            // It must have called supabase.rpc
            expect(supabase.rpc).toHaveBeenCalledWith('get_verified_donations');

            // Assertion checking the values returned
            expect(result.current.donations).toEqual([]);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBe(true);

            // Error should be called
            expect(errorSpy).toHaveBeenCalledWith('Error loading donations:', 'RPC ERROR!');

            errorSpy.mockRestore();
        });
    });

    describe('addDonations tests', () => {
        // Add donations function tests
        it('should successfully add donations with correct parameters', async () => {
            const mockedSupabase = vi.mocked(supabase);

            const mockData = [{ donation_id: 69 }];

            const mockInsert = vi.fn().mockResolvedValue({
                data: mockData,
                error: null,
            });

            mockedSupabase.from.mockReturnValue({
                insert: mockInsert,
            } as unknown as ReturnType<typeof supabase.from>);

            const { result } = renderHook(() => useDonations());

            const payload = {
                userId: 'user-1',
                amount: 69,
                message: 'Stop',
                anonymous: false,
                utr: 'UTR123',
            };

            // act
            let response;
            await act(async () => {
                response = await result.current.addDonation(payload);
            });

            // Assertion: from() called with correct table name
            expect(mockedSupabase.from).toHaveBeenCalledWith('donations');

            // Assertion: the insert() receives the correct payload values
            expect(mockInsert).toHaveBeenCalledWith([
                {
                    user_id: payload.userId,
                    suggested_amount: payload.amount,
                    actual_amount: payload.amount,
                    message: payload.message,
                    anonymous: payload.anonymous,
                    utr: payload.utr,
                },
            ]);

            // Assertion: returns data from Supabase
            expect(response).toEqual(mockData);
        });

        // Add donations error test
        it('should throw an error when Supabase insert fails', async () => {
            // Mocked Supabase
            const mockedSupabase = vi.mocked(supabase);

            const mockInsert = vi.fn().mockResolvedValue({
                data: null,
                error: 'Insert failed.',
            });

            mockedSupabase.from.mockReturnValue({
                insert: mockInsert,
            } as unknown as ReturnType<typeof supabase.from>);

            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { result } = renderHook(() => useDonations());

            // Call addDonation and expect rejection
            await expect(
                act(async () => {
                    await result.current.addDonation({
                        userId: 'user-123',
                        amount: 100,
                        message: 'Test fail',
                        anonymous: false,
                        utr: 'UTR123',
                    });
                }),
            ).rejects.toBe('Insert failed.');

            // Assertion
            expect(errorSpy).toHaveBeenCalled();
            errorSpy.mockRestore();
        });
    });
});
