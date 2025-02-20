import MistralClient from '@mistralai/mistralai';

// Move API key check to a separate function for better error handling
const getMistralClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY;
  if (!apiKey || apiKey === 'your_mistral_api_key_here') {
    throw new Error('Mistral API key not configured');
  }
  return new MistralClient(apiKey);
};

export const analyzeMeetingText = async (text: string) => {
  try {
    const client = getMistralClient();
    
    const response = await client.chat({
      model: 'mistral-tiny',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that analyzes meeting transcripts. Extract key information including action items, dates, times, and create a concise summary. Format the response as JSON with the following structure: { actionItems: string[], dates: string[], times: string[], summary: string, keyPoints: string[] }'
        },
        {
          role: 'user',
          content: text
        }
      ]
    });

    try {
      return JSON.parse(response.choices[0].message.content);
    } catch (e) {
      console.error('Failed to parse Mistral response:', e);
      return {
        actionItems: [],
        dates: [],
        times: [],
        summary: 'Failed to analyze transcript. Please try again.',
        keyPoints: []
      };
    }
  } catch (error) {
    console.error('Error calling Mistral API:', error);
    if (error instanceof Error && error.message === 'Mistral API key not configured') {
      return {
        actionItems: [],
        dates: [],
        times: [],
        summary: 'Please configure your Mistral API key to enable AI analysis.',
        keyPoints: []
      };
    }
    return {
      actionItems: [],
      dates: [],
      times: [],
      summary: 'An error occurred while analyzing the transcript. Please try again.',
      keyPoints: []
    };
  }
};