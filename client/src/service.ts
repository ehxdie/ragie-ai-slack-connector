export async function sendAllMessages(chats: unknown) {
  const lastMessage = (chats as any[]).slice(-1)[0];
  const paramName = lastMessage.content;

  try {
    let token = localStorage.getItem('ragie_token');
    
    if (!token) {
      token = new URLSearchParams(window.location.search).get('token');
      if (token) {
        localStorage.setItem('ragie_token', token);
      } else {
        throw new Error('Authentication token is missing. Please log in.');
      }
    }

    console.log('Using token:', token);

    const response = await fetch(
      `https://ragie-ai-slack-connector-9yhn.onrender.com/api?paramName=${encodeURIComponent(paramName)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (response.status === 401) {
      // Token expired or invalid
      alert('Your session has expired. Redirecting to reinstall the Slack app.');

      // Clear old token from storage
      localStorage.removeItem('ragie_token');
      sessionStorage.removeItem('ragie_token');
      return;
    }

    const responseData = await fetch(
      'https://ragie-ai-slack-connector-9yhn.onrender.com/api/responses',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (responseData.status === 401) {
      // Token expired or invalid
      alert('Your session has expired. Redirecting to reinstall the Slack app.');

      // Clear old token from storage
      localStorage.removeItem('ragie_token');
      sessionStorage.removeItem('ragie_token');

      return;
    }

    const data = await responseData.json();
    const latestResponse =
      data.response
        ?.sort(
          (a: any, b: any) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0]?.answer || 'No response received';

    return {
      role: 'assistant',
      content: latestResponse,
    };
  } catch (error) {
    console.error('Error fetching response:', error);
    return {
      role: 'assistant',
      content: 'Sorry, there was an error processing your request.',
    };
  }
}
