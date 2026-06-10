import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        print("Launching browser...")
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await context.new_page()
        
        # Listen to response to verify auth API call
        page.on("response", lambda res: print(f"[RESP] {res.status} {res.url}") if "/auth" in res.url else None)
        
        print("Navigating to http://localhost:5173/login")
        await page.goto("http://localhost:5173/login")
        await page.wait_for_timeout(2000)
        
        print("Filling credentials...")
        await page.fill("input[placeholder='Email']", "maaastafakhatab200@gmail.com")
        await page.fill("input[placeholder='Password']", "mostafA#22")
        await page.wait_for_timeout(1000)
        
        # Select the form button specifically (the last w-full button or bg-gradient-to-r)
        submit_btn = page.locator("button.bg-gradient-to-r")
        print("Clicking submit button...")
        await submit_btn.click()
        
        print("Waiting 10 seconds for activity...")
        for i in range(10):
            await page.wait_for_timeout(1000)
            print(f"Current URL at {i+1}s: {page.url}")
            if "home" in page.url:
                print("Successfully navigated to /home!")
                break
                
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
