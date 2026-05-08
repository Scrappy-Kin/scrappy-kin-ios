export async function scrollFieldIntoKeyboardSafeView(wrapper: HTMLElement | null) {
  if (!wrapper) return

  const content = wrapper.closest('ion-content') as HTMLIonContentElement | null
  if (!content) {
    wrapper.scrollIntoView({ block: 'center' })
    return
  }

  const scrollElement = await content.getScrollElement()
  const wrapperRect = wrapper.getBoundingClientRect()
  const scrollRect = scrollElement.getBoundingClientRect()
  const targetTop =
    scrollElement.scrollTop +
    wrapperRect.top -
    scrollRect.top -
    (scrollRect.height - wrapperRect.height) / 2

  await content.scrollToPoint(0, Math.max(0, targetTop), 180)
}
