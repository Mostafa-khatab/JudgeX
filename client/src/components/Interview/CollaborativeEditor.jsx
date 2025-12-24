import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';

const CollaborativeEditor = ({ roomId, socketUrl }) => {
	const [code, setCode] = useState('// Start coding here...');
	const socketRef = useRef();
	const editorRef = useRef();

	useEffect(() => {
		socketRef.current = io(socketUrl);

		socketRef.current.emit('join-room', roomId);

		socketRef.current.on('code-change', (newCode) => {
			if (newCode !== code) {
				setCode(newCode);
			}
		});

		return () => {
			socketRef.current.disconnect();
		};
	}, [roomId, socketUrl]);

	const handleEditorChange = (value) => {
		setCode(value);
		socketRef.current.emit('code-change', { roomId, code: value });
	};

	return (
		<div className="h-full w-full border rounded-lg overflow-hidden shadow-lg bg-[#1e1e1e]">
			<Editor
				height="100%"
				defaultLanguage="javascript"
				theme="vs-dark"
				value={code}
				onChange={handleEditorChange}
				onMount={(editor) => (editorRef.current = editor)}
				options={{
					fontSize: 14,
					minimap: { enabled: false },
					scrollBeyondLastLine: false,
					automaticLayout: true,
				}}
			/>
		</div>
	);
};

export default CollaborativeEditor;
