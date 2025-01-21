export default {
	async fetch(request, env, ctx) {
	  const url = new URL(request.url);
	  const port = url.port && !["80", "443"].includes(url.port) ? `:${url.port}` : "";
	  const baseUrl = `${url.protocol}//${url.hostname}${port}`;
	  const path = url.pathname.slice(1); // Remove the leading "/"
	  const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
  
	  // Turnstile keys
	  const TURNSTILE_SECRET_KEY = env.TURNSTILE_SECRET_KEY;
  
	  // Rate limit configuration
	  const RATE_LIMIT = 5; // Number of requests allowed
	  const RATE_LIMIT_WINDOW = 60; // Window in seconds
  
	  async function isRateLimited(clientIp) {
		const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
		const key = `rate_limit:${clientIp}`;
  
		const data = await env.RATE_LIMIT_KV.get(key, { type: "json" });
  
		if (data) {
		  const { count, timestamp } = data;
		  if (currentTime - timestamp < RATE_LIMIT_WINDOW) {
			if (count >= RATE_LIMIT) {
			  return true; // Rate limit exceeded
			} else {
			  // Increment the count
			  await env.RATE_LIMIT_KV.put(
				key,
				JSON.stringify({ count: count + 1, timestamp }),
				{ expirationTtl: RATE_LIMIT_WINDOW }
			  );
			  return false; // Still within the rate limit
			}
		  }
		}
  
		// Create new rate limit record
		await env.RATE_LIMIT_KV.put(
		  key,
		  JSON.stringify({ count: 1, timestamp: currentTime }),
		  { expirationTtl: RATE_LIMIT_WINDOW }
		);
		return false; // No rate limit
	  }
  
	  async function validateTurnstile(token, remoteIp) {
		const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
		  method: "POST",
		  body: new URLSearchParams({
			secret: TURNSTILE_SECRET_KEY,
			response: token
		  }),
		});
		const data = await response.json();
		return data.success;
	  }
  
	  if (request.method === "GET" && (path === "" || path === "script.js" || path === "style.css")) {
		// Serve the local index.html file
		return await env.ASSETS.fetch(request);
	  } else if (request.method === "POST" && path === "") {
		// Rate limit check
		if (await isRateLimited(clientIp)) {
		  return new Response(
			JSON.stringify({ status: 429, message: "Rate limit exceeded. Please try again later." }),
			{ headers: { "Content-Type": "application/json" }, status: 429 }
		  );
		}
  
		// Parse the form data
		const formData = await request.formData();
		const image = formData.get("image");
		const turnstileToken = formData.get("cf-turnstile-response");
  
		// Validate Turnstile token
		const turnstileValid = await validateTurnstile(turnstileToken, clientIp);
		if (!turnstileValid) {
		  return new Response(
			JSON.stringify({ status: 403, message: "Turnstile verification failed." }),
			{ headers: { "Content-Type": "application/json" }, status: 403 }
		  );
		}
  
		if (!image || !image.name) {
		  return new Response(
			JSON.stringify({ status: 400, message: "No image uploaded." }),
			{ headers: { "Content-Type": "application/json" }, status: 400 }
		  );
		}
  
		const extension = image.name.split(".").pop();
		const randomId = crypto.randomUUID(); // Generate a random UUID
		const key = `${randomId}.${extension}`;
  
		await env.BUCKET.put(key, image.stream(), {
		  httpMetadata: { contentType: image.type },
		});
  
		const imageUrl = `${baseUrl}/${key}`;
		return new Response(
		  JSON.stringify({ status: 200, message: `Image uploaded successfully!`, imageUrl: imageUrl }),
		  { headers: { "Content-Type": "application/json" }, status: 200 }
		);
	  } else if (request.method === "GET" && path === "turnstileSiteKey") {
		return new Response(
			JSON.stringify({ status: 200, key: env.TURNSTILE_SITE_KEY }),
			{ headers: { "Content-Type": "application/json" }, status: 200 }
		);
	  } else if (request.method === "GET") {
		// Serve the image if it exists
		const imageKey = path;
  
		try {
		  const object = await env.BUCKET.get(imageKey);
		  if (!object) {
			return new Response(
			  JSON.stringify({ status: 404, message: "Image not found." }),
			  { headers: { "Content-Type": "application/json" }, status: 404 }
			);
		  }
  
		  const headers = new Headers();
		  object.writeHttpMetadata(headers);
		  headers.set("Cache-Control", "public, max-age=31536000");
  
		  return new Response(object.body, { headers });
		} catch (err) {
		  return new Response(
			JSON.stringify({ status: 500, message: "Error fetching image." }),
			{ headers: { "Content-Type": "application/json" }, status: 500 }
		  );
		}
	  } else {
		// Method not allowed
		return new Response(
		  JSON.stringify({ status: 405, message: "Method not allowed." }),
		  { headers: { "Content-Type": "application/json" }, status: 405 }
		);
	  }
	},
  };
  