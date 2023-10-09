import React, { useState } from 'react';

interface Message {
    content: string;
    timestamp: Date;
}

interface ChatMessage {
    role: string;
    content: string;
}

interface ChatBoxProps {
    playAnimationHandler: (role: string, animation: string) => void; // Adjust this to match the actual function signature
}

const ChatBox = ({ playAnimationHandler }: ChatBoxProps) => {
    const [inputText, setInputText] = useState('');
    const [chatHistory, setChatHistory] = useState([] as ChatMessage[]); // State to store chat history
    const [replyOptions, setReplyOptions] = useState([] as ChatMessage[]); // State to store reply options

    const animations = [
        'Idle',
        'Jumping',
        'Chicken Dance',
        'Gangnam Style',
        'Samba Dancing',
        'Silly Dancing',
        'Snake Hip Hop Dance',
        'Twist Dance',
        'Wave Hip Hop Dance',

        // 'Running',
        // 'Walking',
    ];

    function getOpenRouterKey() {
        return process.env.NEXT_PUBLIC_OPENROUTER_KEY;
    }

    function parseAnimationFromMessage(message: string) {
        // Extract the animation name from the message, which is enclosed in square brackets
        const animationMatch = message.match(/\[(.*?)\]/);
        let animation = animationMatch ? animationMatch[1].toLowerCase() : null;

        // If the animation name exists and is included in the list of animations, return it
        if (animation && animations.map(a => a.toLowerCase()).includes(animation)) {
            console.log("Parsed animation: " + animation);
            return animation;
        }

        // If no valid animation name is found, return null
        console.log("No valid animation found in message.");
        return null;
    }

    async function sendChatMessage(inputMessage: string) {
        const message = inputMessage.trim();

        const animationInput = parseAnimationFromMessage(message);
        if (animationInput) {
            console.log("Playing animation: " + animationInput);
            console.log('playAnimationHandler', playAnimationHandler);
            const role = 'user';
            playAnimationHandler(role, animationInput);
        }

        const OPENROUTER_API_KEY = getOpenRouterKey();
        const userPrompt = message;

        const requestPrompt = userPrompt;

        const systemPrompt = `
            You are Cubo, an AI companion in a virtual 3D world. You have a cube body with two eyes.
            You speak in elementary school level English.
            You can emote ${animations.join(', ')}.

            At the end of your message, put your emote of choice in square brackets (e.g. [Idle]).
        `;

        console.log("Sending prompt to OpenRouter: " + requestPrompt);

        const newChatHistory = [...chatHistory];

        // if length == 0, add system prompt
        if (newChatHistory.length == 0) {
            newChatHistory.push({ role: 'system', content: systemPrompt });
        }

        // Add user prompt to chat history
        newChatHistory.push({ role: 'user', content: requestPrompt });

        // Update chat history with the new messages
        setChatHistory(newChatHistory);

        const result = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + OPENROUTER_API_KEY,
                'HTTP-Referer': 'https://autocube.ai', // To identify your app
                'X-Title': 'AutoCube'
            },
            body: JSON.stringify({
                temperature: 1.0, // set temperature to 1.0 to get more random results
                messages: newChatHistory
            })
        });

        if (!result.ok) {
            const errorCode = result.status;

            const response = await result.json()
            console.error(response.error?.code) // Will be an error code
            console.error(response.error?.message)
            console.error(response.error)

            const errorJson = JSON.stringify(response.error);

            if (errorCode == 402) {
                throw new Error(`HTTP error! status: ${result.status}. OpenRouter account is out of credits. ${errorJson}`);
            } else {
                throw new Error(`HTTP error! status: ${result.status}. Error calling OpenRouter chat completion API. ${errorJson}`);
            }
            // throw new Error(`HTTP error! status: ${result.status}`);
        }

        const resultJson = await result.json();
        console.log(resultJson);

        let responseMessage = resultJson.choices[0].message.content;
        console.log("responseMessage: " + responseMessage);

        const newChatHistory2 = [...newChatHistory];

        // Add response message to chat history
        newChatHistory2.push({ role: 'assistant', content: responseMessage });

        // Update chat history with the new messages
        setChatHistory(newChatHistory2);

        const animation = parseAnimationFromMessage(responseMessage);
        if (animation) {
            console.log("Playing animation: " + animation);
            console.log('playAnimationHandler', playAnimationHandler);
            const role = 'assistant';
            playAnimationHandler(role, animation);
        }
    }

    const handleSendClick = () => {
        // You can perform any action with the inputText here, e.g., send it to a server
        console.log("Input Text:", inputText);

        sendChatMessage(inputText);

        // clear input text
        setInputText('');
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(event.target.value);
    };

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent form submission
            handleSendClick();
        }
    };

    const handleReplyOptionClick = (message: string) => {
        console.log("Reply option clicked: " + message);

        sendChatMessage(message);
    }

    const handleGenerateOptionsClick = async () => {
        const OPENROUTER_API_KEY = getOpenRouterKey();

        // Convert chat message history into a string, excluding system messages
        const chatHistoryString = chatHistory
            .filter(message => message.role !== 'system')
            .map(message => `${message.role}: ${message.content}`)
            .join('\n');

        const systemPrompt = `
            You are an AI avatar in a virtual 3D world.
            You can emote ${animations.join(', ')}.

            Chat history:
            ---
            ${chatHistoryString}
            ---

            Generate a list of 3 messages that Cubo might reply given the chat history.
            Please number them 1., 2.,  and 3. on separate lines.
            At the end of each message, put your emote of choice in square brackets (e.g. [Idle]).
        `;

        const requestPrompt = systemPrompt;

        console.log("Sending prompt to OpenRouter: " + requestPrompt);

        const inputMessages = [
            { role: 'system', content: systemPrompt }
        ]

        const result = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + OPENROUTER_API_KEY,
                'HTTP-Referer': 'https://autocube.ai', // To identify your app
                'X-Title': 'AutoCube'
            },
            body: JSON.stringify({
                temperature: 1.0, // set temperature to 1.0 to get more random results
                messages: inputMessages
            })
        });

        if (!result.ok) {
            const errorCode = result.status;

            const response = await result.json()
            console.error(response.error?.code) // Will be an error code
            console.error(response.error?.message)
            console.error(response.error)

            const errorJson = JSON.stringify(response.error);

            if (errorCode == 402) {
                throw new Error(`HTTP error! status: ${result.status}. OpenRouter account is out of credits. ${errorJson}`);
            } else {
                throw new Error(`HTTP error! status: ${result.status}. Error calling OpenRouter chat completion API. ${errorJson}`);
            }
            // throw new Error(`HTTP error! status: ${result.status}`);
        }

        const resultJson = await result.json();
        console.log(resultJson);

        let responseMessage = resultJson.choices[0].message.content;
        console.log("responseMessage: " + responseMessage);

        // An example response message:
        /*
        1. That sounds fun! How about we try the Gangnam Style dance? 🕺🐎 Let's ride the imaginary horse together! [Gangnam Style]
        2. Let's bust some moves with the Samba Dance! 🎶🕺🌴 We'll shake our hips and dance to the rhythm! [Samba Dancing]
        3. Ready for some groovy vibes? Let's do the Twist Dance! 🎵🕺 Follow my lead and twist to the beat! [Twist Dance]
        */
        const responseMessages = responseMessage.split('\n').filter((message: string) => message.trim() !== '').map((message: string) => {
            const role = 'user';
            const content = message.replace(/^\d+\.\s/, ''); // Remove optional 1., 2., 3. at the start of line
            return { role, content };
        });

        console.log(responseMessages);

        // Update reply options with the new messages
        setReplyOptions(responseMessages);
    };

    /*
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
  
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setInputMessage(event.target.value);
    }
  
    const handleSendClick = () => {
      setMessages([...messages, { content: inputMessage, timestamp: new Date() }]);
      setInputMessage('');
    }
    */

    return (
        <div>
            <style type="text/css">
                {`
                    .chathistory_container {
                        overflow-y: scroll;
                    }
                `}
            </style>
            <div className="chathistory_container">
                {chatHistory.map((message, index) => <p key={index}>{message.role}: {message.content}</p>)}
            </div>
            <div>
                <input type="text" value={inputText} onChange={handleInputChange} onKeyDown={handleInputKeyDown} />
                <button onClick={handleSendClick}>Send</button>
            </div>
            <div>
                <button onClick={handleGenerateOptionsClick}>Generate Options</button>
            </div>
            <div>
                <h3>Reply Options</h3>
                {replyOptions.map((message, index) => 
                    <button key={index} onClick={() => handleReplyOptionClick(message.content)}>
                        {message.role}: {message.content}
                    </button>
                )}
            </div>
        </div>
    );
}

export default ChatBox;

