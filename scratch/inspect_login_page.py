import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        await page.goto("http://localhost:5173/login")
        await page.wait_for_timeout(2000)
        
        buttons = await page.locator("button").all()
        print(f"Total buttons found: {len(buttons)}")
        for idx, btn in enumerate(buttons):
            text = await btn.inner_text()
            outer_html = await btn.evaluate("el => el.outerHTML")
            print(f"Button {idx}: Text='{text}', HTML='{outer_html}'")
            
        inputs = await page.locator("input").all()
        print(f"Total inputs found: {len(inputs)}")
        for idx, inp in enumerate(inputs):
            placeholder = await inp.get_attribute("placeholder")
            inp_type = await inp.get_attribute("type")
            outer_html = await inp.evaluate("el => el.outerHTML")
            print(f"Input {idx}: Placeholder='{placeholder}', Type='{inp_type}', HTML='{outer_html}'")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
