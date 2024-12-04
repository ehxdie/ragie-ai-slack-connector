export async function sendAllMessages(chats: unknown) {
  const lastMessage = (chats as any[]).slice(-1)[0];
  const paramName = lastMessage.content;

  try {
    // Post user query to the endpoint
    
    // await fetch(`http://localhost:3000/api?paramName=${encodeURIComponent(paramName)}`, {
    //   method: 'POST'
    // });
    //https://ragie-ai-slack-connector.vercel.app/api/responses

    await fetch(`https://ragie-ai-slack-connector.vercel.app/api?paramName=${encodeURIComponent(paramName)}`, {
      method: 'POST'
    });

    // Fetch response from the responses endpoint

    //const responseData = await fetch('http://localhost:3000/api/responses');
    const responseData = await fetch('https://ragie-ai-slack-connector.vercel.app/api/responses');

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