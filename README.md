# Masala Lead Scraper

Scrapes masala retailer and distributor contacts in Delhi via Firecrawl.
Outputs a formatted Excel file with 5,000 leads.

## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Set your Firecrawl API key**

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
FIRECRAWL_API_KEY=your_key_here
```

**3. Run**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Click **Start Scraping** — the scraper runs 220 search queries (11 business types × 20 Delhi localities) using both Google search and JustDial direct scraping in parallel.
2. Watch the live counters update every 3 seconds.
3. When done (or whenever you have enough leads), click **Download Excel**.

## Output

Excel file: `masala-leads-YYYY-MM-DD.xlsx`

| Column | Description |
|--------|-------------|
| S.No | Row number |
| Business Name | Name of the shop/company |
| Phone | Primary phone (10-digit normalized) |
| WhatsApp | WhatsApp number |
| Address | Full street address |
| Locality | Area within Delhi |

## Notes

- **Target:** 5,000 unique leads (stops automatically)
- **Dedup:** leads are deduplicated by normalized 10-digit phone number
- **Checkpoint:** progress saved to `checkpoint.json` every 50 leads — if the server restarts, click Start again to resume
- **Concurrency:** 2 parallel Firecrawl requests (polite rate limiting)
- **Credits used:** ~10,000–15,000 Firecrawl credits for a full 5,000-lead run
