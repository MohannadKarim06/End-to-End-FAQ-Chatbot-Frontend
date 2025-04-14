import React, { useState } from "react";
import axios from "axios";
import Papa from "papaparse";
import os;
import {
  Box, Button, Container, Flex, Input, Select, Text, VStack,
  useToast, useColorMode, useColorModeValue
} from "@chakra-ui/react";

const chatURL = import.meta.env.VITE_CHAT_API_URL;
const uploadURL = import.meta.env.VITE_UPLOAD_API_URL;

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [faqSource, setFaqSource] = useState("default");
  const [file, setFile] = useState(null);
  const toast = useToast();

  const bgColor = useColorModeValue("gray.50", "gray.800");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const res = await axios.post(chatURL, {
        message: input,
        faq_source: faqSource,
      });

      const botReply = {
        role: "assistant",
        content: res.data?.response || "Sorry, I couldn't understand that.",
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Could not reach the chatbot API." },
      ]);
    }
  };

  const handleUpload = () => {
    if (!file) {
      toast({ title: "No file selected", status: "warning", duration: 3000 });
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async function (results) {
        const columns = Object.keys(results.data[0] || {});
        const hasRequiredCols = columns.includes("question") && columns.includes("answer");

        if (!hasRequiredCols) {
          toast({
            title: "Invalid CSV",
            description: "CSV must contain 'question' and 'answer' columns.",
            status: "error",
            duration: 5000,
          });
          return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await axios.post(uploadURL, formData);
          if (res.status === 200) {
            toast({
              title: "FAQ uploaded and processed!",
              status: "success",
              duration: 3000,
            });
            setFaqSource("uploaded");
          } else {
            throw new Error();
          }
        } catch (err) {
          toast({
            title: "Upload Failed",
            description: "Unable to upload FAQ file.",
            status: "error",
            duration: 3000,
          });
        }
      },
    });
  };

  return (
    <Container maxW="container.md" py={6}>
      <Text fontSize="2xl" fontWeight="bold" mb={4}>💬 FAQ Chatbot</Text>

      <Flex mb={4} gap={4} wrap="wrap">
        <Select
          value={faqSource}
          onChange={(e) => setFaqSource(e.target.value)}
          width="40%"
        >
          <option value="default">Default FAQs</option>
          <option value="uploaded">Uploaded FAQs</option>
        </Select>

        <Input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          width="40%"
        />
        <Button onClick={handleUpload} colorScheme="blue">Upload</Button>
      </Flex>

      <VStack
        align="stretch"
        border="1px solid #ddd"
        borderRadius="md"
        height="400px"
        overflowY="auto"
        p={3}
        mb={4}
        spacing={3}
        bg={bgColor}
      >
        {messages.map((msg, idx) => (
          <Box
            key={idx}
            alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
            bg={msg.role === "user" ? "blue.100" : "gray.200"}
            borderRadius="md"
            px={3}
            py={2}
            maxW="80%"
          >
            <Text>{msg.content}</Text>
          </Box>
        ))}
      </VStack>

      <Flex gap={2}>
        <Input
          placeholder="Type your question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <Button onClick={sendMessage} colorScheme="blue">Send</Button>
      </Flex>
    </Container>
  );
}

export default App;
