async function signInMessageProvider() {
  const url = `${process.env.MESSAGE_API_BASE_URL}/api/auth/sign-in`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: process.env.MESSAGE_API_USERNAME,
      password: process.env.MESSAGE_API_PASSWORD,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`message provider sign-in failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const token = data.token || data.accessToken || data.access_token;

  if (!token) {
    throw new Error("message provider sign-in returned no token");
  }

  return token;
}


async function sendWhatsAppMessage({ to, text }) {
  const token = await signInMessageProvider();

  const url = `${process.env.MESSAGE_API_BASE_URL}/message/send`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      channel: {
        channelTypeSlug: "WHATSAPP",
        to,
        from: process.env.MESSAGE_API_FROM,
      },
      text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`message provider send failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data;
}


module.exports = { signInMessageProvider, sendWhatsAppMessage };