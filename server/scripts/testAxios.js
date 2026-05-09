import axios from 'axios';
import * as cheerio from 'cheerio';

const testAxios = async () => {
    try {
        console.log('Fetching with axios...');
        const response = await axios.get('https://codeforces.com/blog/entry/125000', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(response.data);
        const content = $('.ttypography').html();
        if (content) {
            console.log('Content found! Length:', content.length);
        } else {
            console.log('Content NOT found. Title:', $('title').text());
        }
    } catch (err) {
        console.error('Axios failed:', err.message);
    }
};

testAxios();
