import React from "react"
import { Box, H2, H4, Text } from "@adminjs/design-system"

const links: { title: string; description: string; href: string; external?: boolean }[] = [
  {
    title: "Species",
    description: "Manage the plant species catalog.",
    href: "/admin/resources/PlantSpecies",
  },
  {
    title: "Users",
    description: "View and manage app users.",
    href: "/admin/resources/User",
  },
  {
    title: "Achievements",
    description: "Manage gamification achievements.",
    href: "/admin/resources/Achievement",
  },
  {
    title: "User Plants",
    description: "Browse plants added by users.",
    href: "/admin/resources/UserPlant",
  },
  {
    title: "API Docs",
    description: "Open the interactive API reference.",
    href: "/docs",
    external: true,
  },
  {
    title: "Repository",
    description: "Open the backend source on GitHub.",
    href: "https://github.com/ECO-2/BACKEND-ECO-2",
    external: true,
  },
]

const Dashboard: React.FC = () => {
  return (
    <Box variant="grey" p="xl">
      <Box mb="xl">
        <img src="/icono.png" alt="ECO2" style={{ height: 64, marginBottom: -20 }} />
        <H2>ECO2 Backoffice</H2>
        <Text color="grey60">Quick access to the sections you use most.</Text>
      </Box>
      <Box display="flex" flexWrap="wrap" style={{ gap: 16 }}>
        {links.map((link) => (
          <Box
          
            key={link.title}
            as="a"
            href={link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noopener noreferrer" : undefined}
            style={{
              textDecoration: "none",
              cursor: "pointer",
              color: "#0D2B31",
              backgroundColor: "white",
              padding: 24,
              borderRadius: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
              width: "30%",
              minWidth: 260,
              display: "block",
            }}
          >
            <H4>{link.title}</H4>
            <Text color="grey60" mt="default">
              {link.description}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default Dashboard