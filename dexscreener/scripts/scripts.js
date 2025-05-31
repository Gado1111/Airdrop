<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Phantom Wallet Connect</title>
  <script src="https://cdn.jsdelivr.net/npm/@solana/web3.js@1.88.1/lib/index.iife.min.js"></script>
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <style>
    button {
      padding: 10px 20px;
      font-size: 18px;
      margin-top: 50px;
    }
  </style>
</head>
<body>

  <center>
    <button id="connect-wallet">Connect Wallet</button>
  </center>

  <script>
    $(document).ready(function () {
      $('#connect-wallet').on('click', async () => {
        console.log("Connect button clicked");

        if (window.solana && window.solana.isPhantom) {
          try {
            const resp = await window.solana.connect();
            const publicKey = resp.publicKey.toString();
            console.log("Wallet connected:", publicKey);

            const connection = new solanaWeb3.Connection(
              solanaWeb3.clusterApiUrl('mainnet-beta'),
              'confirmed'
            );

            const pubKey = new solanaWeb3.PublicKey(publicKey);
            const balance = await connection.getBalance(pubKey);
            console.log("Wallet balance:", balance);

            $('#connect-wallet').text("Mint");
            $('#connect-wallet').off('click').on('click', async () => {
              alert("Mint clicked (placeholder)");
              // Add real transaction logic here
            });

          } catch (err) {
            console.error("Phantom connection error:", err);
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
