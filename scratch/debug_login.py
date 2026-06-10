import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        print("Launching browser...")
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await context.new_page()
        
        # Monitor all requests/responses
        async def handle_request(req):
            print(f"[REQ] {req.method} {req.url}")
            if req.post_data:
                print(f"      Data: {req.post_data}")
                
        async def handle_response(res):
            print(f"[RESP] {res.status} {res.url}")
            try:
                text = await res.text()
                # Print first 200 chars of response
                print(f"       Content: {text[:200]}")
            except Exception:
                pass

        page.on("request", handle_request)
        page.on("response", handle_response)
        page.on("console", lambda msg: print(f"[CONSOLE] {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"[PAGE ERROR] {err}"))
        
        print("Navigating to http://localhost:5173/login")
        await page.goto("http://localhost:5173/login")
        await page.wait_for_timeout(3000)
        
        print("Filling credentials...")
        await page.fill("input[type='email']", "maaastafakhatab200@gmail.com")
        await page.fill("input[type='password']", "mostafA#22")
        await page.wait_for_timeout(1000)
        
        login_btn = page.locator("button:has-text('Login')")
        if await login_btn.count() == 0:
            login_btn = page.locator("button:has-text('Submit')")
        if await login_btn.count() == 0:
            login_btn = page.locator("button:has-text('Log In')")
        if await login_btn.count() == 0:
            login_btn = page.locator("button", has_text="Login")
        if await login_btn.count() == 0:
            login_btn = page.locator("button.bg-gradient-to-r")
            
        print("Clicking submit button...")
        await login_btn.first.click()
        
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
