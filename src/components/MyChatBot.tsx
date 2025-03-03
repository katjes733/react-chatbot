import { GoogleGenerativeAI } from "@google/generative-ai";
import ChatBot, { Settings } from "react-chatbotify";
import MarkdownRenderer, { MarkdownRendererBlock } from "@rcb-plugins/markdown-renderer";

const styles = {
    chatWindowStyle: {
        minWidth: '300px',
        width: '100vw',
        minHeight: '575px',
        height: '100vh',
    },
  };

const themes = [
    {id: "chatgpt", version: "0.1.0"} 
]

const settings: Settings = {
    general: {
        embedded: true
    },
    chatHistory: {
        storageKey: "example_real_time_stream"
    },
    botBubble: {
        simStream: true
    },
	header: {
		title: (
			<div style={{cursor: "pointer", margin: 0, fontSize: 20, fontWeight: "bold"}} onClick={
				() => window.open("https://github.com/katjes733/")
			}>
				React Chatbot
			</div>
		),
	},
}

const MyChatBot = () => {
	let apiKey: string = process.env.NEXT_PUBLIC_LLM_API_KEY || "";
	const modelType = "gemini-2.0-flash";
	let hasError = false;

    const plugins = [MarkdownRenderer()];

	// example gemini stream
	// you can replace with other LLMs or even have a simulated stream
	const gemini_stream = async (params) => {
		try {
			const genAI = new GoogleGenerativeAI(apiKey);
			const model = genAI.getGenerativeModel({ model: modelType });
			const result = await model.generateContentStream(params.userInput);

			let text = "";
			let offset = 0;
			for await (const chunk of result.stream) {
				const chunkText = chunk.text();
				text += chunkText;
				// inner for-loop used to visually stream messages character-by-character
				// feel free to remove this loop if you are alright with visually chunky streams
				for (let i = offset; i < chunkText.length; i++) {
					// while this example shows params.streamMessage taking in text input,
					// you may also feed it custom JSX.Element if you wish
					await params.streamMessage(text.slice(0, i + 1));
					await new Promise(resolve => setTimeout(resolve, 30));
				}
				offset += chunkText.length;
			}

			// in case any remaining chunks are missed (e.g. timeout)
			// you may do your own nicer logic handling for large chunks
			for (let i = offset; i < text.length; i++) {
				await params.streamMessage(text.slice(0, i + 1));
				await new Promise(resolve => setTimeout(resolve, 30));
			}
			await params.streamMessage(text);

			// we call endStreamMessage to indicate that all streaming has ended here
			await params.endStreamMessage();
		} catch (error) {
			await params.injectMessage("Unable to load model, is your API Key valid?");
			hasError = true;
		}
	}
	const flow={
		start: {
			message: apiKey ? "Ask me anything!" : "Enter your Gemini api key and start asking away!",
			path: apiKey ? "loop" : "api_key",
			isSensitive: !apiKey,
            renderMarkdown: ["BOT", "USER"],
		} as MarkdownRendererBlock,
		api_key: {
			message: (params) => {
				apiKey = params.userInput.trim();
				return "Ask me anything!";
			},
			path: "loop",
            renderMarkdown: ["BOT", "USER"],
		} as MarkdownRendererBlock,
		loop: {
			message: async (params) => {
				await gemini_stream(params);
			},
			path: () => {
				if (hasError) {
					return "start"
				}
				return "loop"
			},
            renderMarkdown: ["BOT", "USER"],
		} as MarkdownRendererBlock
	}
	return (
        <div style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
            <ChatBot 
                themes={themes}
                styles={styles}
                settings={settings} 
                flow={flow}
                plugins={plugins}/>
        </div>
	);
};

export default MyChatBot;