import React, { useContext } from 'react'
import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { ThemeContext } from '../../styles/theming'

export default function TabBarComponent(props: BottomTabBarProps) {
  const { theme } = useContext(ThemeContext)

  return (
    <BottomTabBar
      {...props}
      activeTintColor={theme.activeTintColor}
      inactiveTintColor={theme.inactiveTintColor}
      inactiveBackgroundColor={theme.primary}
      activeBackgroundColor={theme.activeBackgroundColor}
      style={{ backgroundColor: theme.primary }}
    />
  )
}
