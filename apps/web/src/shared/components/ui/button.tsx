// O ai consome a UI compartilhada do platform (@chronokairo/platform/ui).
// Reexporta o Button do platform para manter o ponto de import local estável.
// Débito (ADR-0001): migrar os demais componentes de shell (SideNavBar/TopNavBar/...) para o platform.
export { Button, type ButtonProps } from '@chronokairo/platform/ui';
