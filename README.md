# 🖼 ImageHost
An instant image hosting app, which can be deployed to Cloudflare Worker. This is a project I made in 3 hours before Lunar New Year holiday.

## Demo
Live demo can be found at https://imagehost.baokhang4930.workers.dev/

## Installation
You will need to install NodeJS in your PC and a Cloudflare account before going through this installation process.
### 1. Clone this repository
Run these command in your terminal.
```
git clone https://github.com/actuallyundefined/ImageHost.git
cd ImageHost
```

### 2. Install prerequisites
Run these command in your terminal.
```
npm install
```

### 3. Make your configuration file
Rename `wrangler.example.json` to `wrangler.json`

In `wrangler.json`, change the "name" field to your chosen app name. This will be use for default worker subdomain, like https://imagehost.baokhang4930.workers.dev/, which "imagehost" is my chosen name, and "baokhang4930" is my Cloudflare account name.

Don't touch another field just yet.

### 4. Create required Cloudflare services
Required Cloudflares services are R2, KV, and Turnstile. R2 is used to store uploaded images, RV is used to store rate limit, and Turnstile is used for protecting from spam (for who don't know, Turnstile is Cloudflare's CAPTCHA service).

They can be created right in terminal in your app folder, but you will need to login into Cloudflare Dashboard to activate R2 free plan (you would need a payment method). To activate R2 free plan, go to Cloudflare Dashboard > Your Account > R2 Object Storage, follow the instruction, but don't create any R2 bucket just yet.

Now, back to the terminal. First, we will need to login to your Cloudflare account by using this command:
```
npx wrangler login
```

Create your R2 bucket by running:
```
npx wrangler r2 bucket create <YOUR_BUCKET_NAME>
```

After it's done running, edit this part in your `wrangler.json`:
```json
"r2_buckets": [
    {
      "bucket_name": "imagedb", //Replace it with your chosen bucket name
      "binding": "BUCKET" // DON'T TOUCH THIS!!!!!
    }
]
```

Now let's create your KV. Run this command:
```
npx wrangler kv namespace create <YOUR_KV_NAME>
```
After it's done, something like this will popup.
```
🌀 Creating namespace with title <YOUR_APP_NAME>-<YOUR_KV_NAME>
✨ Success!
Add the following to your configuration file:
[[kv_namespaces]]
binding = "<YOUR_KV_NAME>"
id = "<BINDING_ID>"
```
Take note of the id. **DON'T FOLLOW THAT!!**

Edit this part in your `wrangler.json`:
```json
"kv_namespaces": [
    {
      "binding": "RATE_LIMIT_KV", // DON'T TOUCH THIS!!!!!
      "id": "<YOUR_ID>" // Replace it with the id you have earlier
    }
]
```

Finally, your Turnstile widget. Login into your Cloudflare Dashboard > Your Account > Turnstile > Add widget

Fill in your widget name (anything you want). In Hostname Management, add `127.0.0.1`, and then press Create.

Now it will give you 2 things, the site key and the secret key, fill both of them in `wrangler.json`:
```json
"vars": {
    "TURNSTILE_SITE_KEY": "SITE_KEY",
    "TURNSTILE_SECRET_KEY": "SECRET_KEY"
}
```

Try to run your app locally using this command
```
npm run start
```

It will give you a local URL, try take a look and see if everything works.

Now it's time to deploy it!

```
npx wrangler deploy
```

After you run it, it will give you your final, production app link. Don't go to it yet. Back to your Turnstile page, and add your production app link into Hostname Management.

And that's it! Enjoy!

## Contribution
Thanks Cloudflare with it's wonderful and generous free plan, without it this might not be exist!

And thanks ChatGPT to help me make this easier :D

Original drag & drop code snippet ~~I stolen~~: https://codepen.io/dcode-software/pen/xxwpLQo