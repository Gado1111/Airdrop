<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Phantom Connect Demo</title>
  <script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.js"></script>
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <style>
    button {
      padding: 10px 20px;
      font-size: 18px;
    }
  </style>
</head>
<body>

  <button id="connect-wallet">Connect Wallet</button>

  <script>
    $(document).ready(function () {
      const solanaWeb3Lib = solanaWeb3; // Bind the global

      $('#connect-wallet').on('click', async () => {
        console.log("Connect button clicked");

        if (window.solana && window.solana.isPhantom) {
          try {
            const resp = await window.solana.connect();
            const publicKey = resp.publicKey.toString();
            console.log("Wallet connected:", publicKey);

            // Create a connection
            const connection = new solanaWeb3Lib.Connection(
              solanaWeb3Lib.clusterApiUrl('mainnet-beta'),
              'confirmed'
            );

            const walletPublicKey = new solanaWeb3Lib.PublicKey(publicKey);
            const balance = await connection.getBalance(walletPublicKey);
            console.log("Wallet balance (lamports):", balance);

            $('#connect-wallet').text("Mint");
            $('#connect-wallet').off('click').on('click', async () => {
              alert("Mint clicked. (This is a placeholder)");
              // Add transaction logic here...
            });

          } catch (err) {
            console.error("Phantom connect error:", err);
            alert("Connection failed: " + (err.message || "Unknown error"));
          }
        } else {
          alert("Phantom Wallet is not installed.");
          const url = navigator.userAgent.includes("Firefox")
            ? "https://addons.mozilla.org/en-US/firefox/addon/phantom-app/"
            : "https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa";
          window.open(url, "_blank");
        }
      });
    });
  </script>

</body>
</html>
