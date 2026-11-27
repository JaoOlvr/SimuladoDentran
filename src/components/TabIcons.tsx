import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface TabIconProps {
  color: string;
  size?: number;
  focused?: boolean;
}

/**
 * Ícone SVG nativo de Veículo / Carro para a aba Início (Simulados).
 * 100% vetorial, sem dependência de fontes externas ou arquivos TTF.
 */
export function SimuladosTabIcon({ color, size = 24, focused = false }: TabIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      {/* Carroceria Superior */}
      <Path
        d="M5 11L6.8 5.6C7.05 4.85 7.75 4.33 8.54 4.33H15.46C16.25 4.33 16.95 4.85 17.2 5.6L19 11M5 11H19"
        stroke={color}
        strokeWidth={focused ? 2.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Corpo Principal */}
      <Path
        d="M3 11H21V16C21 16.55 20.55 17 20 17H19M3 11V16C3 16.55 3.45 17 4 17H5"
        stroke={color}
        strokeWidth={focused ? 2.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Roda Esquerda */}
      <Circle
        cx="7"
        cy="17"
        r="2.5"
        stroke={color}
        strokeWidth={focused ? 2.2 : 1.8}
        fill={focused ? color : 'none'}
      />
      {/* Roda Direita */}
      <Circle
        cx="17"
        cy="17"
        r="2.5"
        stroke={color}
        strokeWidth={focused ? 2.2 : 1.8}
        fill={focused ? color : 'none'}
      />
      {/* Linha Central entre as rodas */}
      <Path
        d="M9.5 17H14.5"
        stroke={color}
        strokeWidth={focused ? 2.2 : 1.8}
        strokeLinecap="round"
      />
      {/* Faróis */}
      <Circle cx="5.5" cy="13" r="0.8" fill={color} />
      <Circle cx="18.5" cy="13" r="0.8" fill={color} />
    </Svg>
  );
}

/**
 * Ícone SVG nativo de Usuários / Alunos para a aba Alunos.
 */
export function AlunosTabIcon({ color, size = 24, focused = false }: TabIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      {/* Cabeça Usuário Principal */}
      <Circle
        cx="9"
        cy="8"
        r="3.5"
        stroke={color}
        strokeWidth={focused ? 2.2 : 1.8}
        fill={focused ? color : 'none'}
      />
      {/* Corpo Usuário Principal */}
      <Path
        d="M3 19C3 15.6863 5.68629 13 9 13C12.3137 13 15 15.6863 15 19"
        stroke={color}
        strokeWidth={focused ? 2.2 : 1.8}
        strokeLinecap="round"
      />
      {/* Cabeça Usuário Secundário (fundo) */}
      <Path
        d="M14.5 5.5C15.1 5.05 15.9 4.8 16.7 4.8C18.6 4.8 20.2 6.4 20.2 8.3C20.2 9.4 19.7 10.4 18.9 11"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      {/* Corpo Usuário Secundário */}
      <Path
        d="M17.5 14C19.5 14.4 21 16.1 21 18.2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Ícone SVG nativo de Configurações / Ajustes para a aba Ajustes / LGPD.
 */
export function ConfiguracoesTabIcon({ color, size = 24, focused = false }: TabIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      {/* Miolo Central */}
      <Circle
        cx="12"
        cy="12"
        r="3.2"
        stroke={color}
        strokeWidth={focused ? 2.2 : 1.8}
        fill={focused ? color : 'none'}
      />
      {/* Engrenagem Externa */}
      <Path
        d="M12 2V4.5M12 19.5V22M2 12H4.5M19.5 12H22M4.93 4.93L6.7 6.7M17.3 17.3L19.07 19.07M4.93 19.07L6.7 17.3M17.3 6.7L19.07 4.93"
        stroke={color}
        strokeWidth={focused ? 2.4 : 1.9}
        strokeLinecap="round"
      />
      {/* Anel Externo Interconectado */}
      <Circle
        cx="12"
        cy="12"
        r="7.5"
        stroke={color}
        strokeWidth={focused ? 2 : 1.6}
        strokeDasharray="2 3.5"
      />
    </Svg>
  );
}
