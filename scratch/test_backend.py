import urllib.request
import urllib.error
import json

def test_login():
    url = "http://localhost:8080/auth/login"
    data = {
        "email": "maaastafakhatab200@gmail.com",
        "password": "mostafA#22"
    }
    req_data = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as response:
            print("Status:", response.status)
            print("Response:", response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print("HTTP Error:", e.code)
        print("Error content:", e.read().decode("utf-8"))
    except Exception as e:
        print("General Error:", e)

if __name__ == "__main__":
    test_login()
