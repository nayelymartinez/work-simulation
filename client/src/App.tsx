import { useEffect, useState } from "react";
import { Container, VStack } from "@chakra-ui/react";
import { Transcript } from "./components/ui/Transcript";

interface User {
  id: number;
  name: string;
  email: string;
}

function App() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + "/users")
      .then((res) => res.json())
      .then(setUsers);
  }, []);

  return (
    <Container maxW="container.md" py={8}>
      <VStack gap={6}>
        {/* <Heading as="h1" size="xl">
          Blueprint AI Work Simulation Exercise
        </Heading> */}
        <VStack gap={4} width="100%">
          <Transcript />
        </VStack>
      </VStack>
    </Container>
  );
}

export default App;
