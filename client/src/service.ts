export async function sendAllMessages(chats: unknown) {
  const lastMessage = (chats as any[]).slice(-1)[0];
  const paramName = lastMessage.content;

  try {

    // Post user query to the endpoint   
    const token = localStorage.getItem('ragie_token') ||
      new URLSearchParams(window.location.search).get('token');

    if (!token) {
      throw new Error('Authentication token is missing. Please log in.');
    }
    
    console.log(token)

    // Post user query to the endpoint with Authorization header
    await fetch(`https://ragie-ai-slack-connector-9yhn.onrender.com/api?paramName=${encodeURIComponent(paramName)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Add token to Authorization header
      }
    });
    // Fetch response from the responses endpoint

    // Local
    // const responseData = await fetch('http://localhost:3000/api/responses');

    // Production
    // Fetch response from the responses endpoint, passing token in Authorization header
    const responseData = await fetch('https://ragie-ai-slack-connector-9yhn.onrender.com/api/responses', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}` // Add token to Authorization header for the GET request
      }
    });

    const data = await responseData.json();
    console.log(data);
    const latestResponse = data.response
      ?.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.answer
      || 'No response received';
    
    return {
      role: 'assistant',
      content: latestResponse 
    };
  } catch (error) {
    console.error('Error fetching response:', error);
    return {
      role: 'assistant',
      content: 'Sorry, there was an error processing your request.'
    };
  }
}