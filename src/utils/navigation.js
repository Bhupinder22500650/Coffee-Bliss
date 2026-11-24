export function returnToTab(navigation, screen = 'Home') {
  navigation.popTo('Tabs', { screen });
}
