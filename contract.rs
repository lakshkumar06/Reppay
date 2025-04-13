use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("8S8xBT9QucqzVdybrp7Yaxkw77WVqpdc19bsLBcXidtZ");

#[account]
pub struct Escrow {
    pub sponsor: Pubkey,
    pub merchant: Pubkey,
    pub amount_allocated: u64,
    pub amount_claimed: u64,
    pub created_at: i64,
    pub last_claimed_at: Option<i64>,
}

impl Escrow {
    pub const LEN: usize = 32 + 32 + 8 + 8 + 8 + 9; // 97 bytes
}

#[event]
pub struct EscrowClaimed {
    pub sponsor: Pubkey,
    pub merchant: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[program]
pub mod Reppay {
    use super::*;

    pub fn direct_transfer(ctx: Context<DirectTransfer>, amount: u64) -> Result<()> {
        let cpi_accounts = Transfer {
            from: ctx.accounts.sponsor_token_account.to_account_info(),
            to: ctx.accounts.merchant_token_account.to_account_info(),
            authority: ctx.accounts.sponsor.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;
        Ok(())
    }

    pub fn init_escrow(ctx: Context<InitEscrow>, amount: u64) -> Result<()> {
        let clock = Clock::get()?;
        let escrow = &mut ctx.accounts.escrow;
        escrow.sponsor = ctx.accounts.sponsor.key();
        escrow.merchant = ctx.accounts.merchant.key();
        escrow.amount_allocated = amount;
        escrow.amount_claimed = 0;
        escrow.created_at = clock.unix_timestamp;
        escrow.last_claimed_at = None;

        let cpi_accounts = Transfer {
            from: ctx.accounts.sponsor_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.sponsor.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;
        Ok(())
    }

    pub fn claim_from_escrow(ctx: Context<ClaimFromEscrow>, claim_amount: u64) -> Result<()> {
        let clock = Clock::get()?;
        let escrow = &mut ctx.accounts.escrow;

        require!(
            escrow.amount_claimed + claim_amount <= escrow.amount_allocated,
            ZeppayError::OverClaim
        );

        require!(
            ctx.accounts.escrow_token_account.mint == ctx.accounts.merchant_token_account.mint,
            ZeppayError::MintMismatch
        );

        let bump = ctx.bumps.escrow_signer;
        let signer_seeds = &[
            b"escrow_signer",
            escrow.sponsor.as_ref(),
            escrow.merchant.as_ref(),
            &[bump],
        ];
        let signer = &[&signer_seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.merchant_token_account.to_account_info(),
            authority: ctx.accounts.escrow_signer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(
            CpiContext::new_with_signer(cpi_program, cpi_accounts, signer),
            claim_amount,
        )?;

        escrow.amount_claimed += claim_amount;
        escrow.last_claimed_at = Some(clock.unix_timestamp);

        emit!(EscrowClaimed {
            sponsor: escrow.sponsor,
            merchant: escrow.merchant,
            amount: claim_amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    pub fn cancel_escrow(ctx: Context<CancelEscrow>) -> Result<()> {
        let bump = ctx.bumps.escrow_signer;
        let signer_seeds = &[
            b"escrow_signer",
            ctx.accounts.escrow.sponsor.as_ref(),
            ctx.accounts.escrow.merchant.as_ref(),
            &[bump],
        ];
        let signer = &[&signer_seeds[..]];

        let remaining_amount =
            ctx.accounts.escrow.amount_allocated - ctx.accounts.escrow.amount_claimed;

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.sponsor_token_account.to_account_info(),
            authority: ctx.accounts.escrow_signer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(
            CpiContext::new_with_signer(cpi_program, cpi_accounts, signer),
            remaining_amount,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct DirectTransfer<'info> {
    #[account(mut)]
    pub sponsor: Signer<'info>,
    #[account(mut)]
    pub sponsor_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub merchant_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct InitEscrow<'info> {
    #[account(mut)]
    pub sponsor: Signer<'info>,
    /// CHECK: only used as pubkey
    pub merchant: AccountInfo<'info>,

    #[account(
        init,
        seeds = [b"escrow", sponsor.key().as_ref(), merchant.key().as_ref()],
        bump,
        payer = sponsor,
        space = 8 + Escrow::LEN
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub sponsor_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ClaimFromEscrow<'info> {
    #[account(mut, has_one = merchant)]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub merchant: Signer<'info>,
    #[account(mut)]
    pub merchant_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    /// CHECK: derived PDA authority for escrow
    #[account(
        seeds = [b"escrow_signer", escrow.sponsor.as_ref(), escrow.merchant.as_ref()],
        bump
    )]
    pub escrow_signer: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelEscrow<'info> {
    #[account(mut, has_one = sponsor)]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub sponsor: Signer<'info>,
    #[account(mut)]
    pub sponsor_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    /// CHECK: derived PDA authority for escrow
    #[account(
        seeds = [b"escrow_signer", escrow.sponsor.as_ref(), escrow.merchant.as_ref()],
        bump
    )]
    pub escrow_signer: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum ZeppayError {
    #[msg("Merchant tried to claim more than allocated.")]
    OverClaim,
    #[msg("Token account mint mismatch.")]
    MintMismatch,
}
