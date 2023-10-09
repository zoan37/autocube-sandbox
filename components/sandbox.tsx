import React, { useRef, useState } from 'react'
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber'
import Head from 'next/head';

function Box(props) {
  const mesh = useRef(null)
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)
  useFrame((state, delta) => (mesh.current.rotation.x += delta))
  return (
    <mesh
      {...props}
      ref={mesh}
      scale={active ? 1.5 : 1}
      onClick={(event) => setActive(!active)}
      onPointerOver={(event) => setHover(true)}
      onPointerOut={(event) => setHover(false)}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  )
}

interface ChatMessage {
  role: string;
  content: string;
}

export default function Sandbox() {
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState([] as ChatMessage[]); // State to store chat history

  function getOpenRouterKey() {
    return process.env.NEXT_PUBLIC_OPENROUTER_KEY;
  }

  async function sendChatMessage(inputMessage: string) {
    const message = inputMessage.trim();

    const OPENROUTER_API_KEY = getOpenRouterKey();
    const userPrompt = message;

    const requestPrompt = userPrompt;

    const systemPrompt = `
      You are Cubo, an AI companion in a virtual 3D world. You have a cube body with two eyes.
      You speak in elementary school level English.
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

    // Add response message to chat history
    newChatHistory.push({ role: 'assistant', content: responseMessage });

    // Update chat history with the new messages
    setChatHistory(newChatHistory);
  }

  const handleSendClick = () => {
    // You can perform any action with the inputText here, e.g., send it to a server
    console.log("Input Text:", inputText);

    sendChatMessage(inputText);
  };

  const handleInputChange = (event) => {
    setInputText(event.target.value);
  };

  return (
    <div>
      <Head>
        <title>AutoCube Sandbox</title>
        <link href="/logo/favicon.svg" rel="icon" />

        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-4bw+/aepP/YC94hEpVNVgiZdgIC5+VKNBQNGCHeKRQN+PtmoHDEXuppvnDJzQIu9" crossOrigin="anonymous"></link>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/js/bootstrap.bundle.min.js" integrity="sha384-HwwvtgBNo3bZJJLYd8oVXjrBZt8cqVSpeBNS5n7C8IVInixGAoxmnlMuBnhbgrkm" crossOrigin="anonymous" async></script>
      </Head>
      <div className="container mt-3 mb-3">
        <h3>AutoCube Sandbox</h3>
        <div className="mt-3">
          <input
            type="text"
            className="form-control"
            placeholder="Message"
            value={inputText}
            onChange={handleInputChange}
          />
        </div>
        <div className="mt-3">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSendClick}
          >
            Send
          </button>
        </div>
      </div>
      <Canvas>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <Box position={[-1.2, 0, 0]} />
        <Box position={[1.2, 0, 0]} />
      </Canvas>
    </div>
  )
}