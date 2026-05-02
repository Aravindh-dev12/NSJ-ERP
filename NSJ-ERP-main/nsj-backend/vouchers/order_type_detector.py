"""
Smart Order Type Detection based on Item Name Keywords
Automatically assigns Order ID prefix (A/B/C/D) based on item name analysis.
"""

import re
from typing import Optional


class OrderTypeDetector:
    """
    Analyzes item names to automatically determine the correct order type
    and corresponding Order ID prefix (A, B, C, D).
    """

    # Keywords for each order type (case-insensitive)
    KEYWORDS = {
        "LOOSE_DIAMONDS": [
            # Loose diamond keywords
            "loose diamond",
            "loose",
            "diamond stone",
            "unset diamond",
            "diamond parcel",
            "rough diamond",
            "polished diamond",
            "diamond lot",
            "diamond piece",
            "diamond carat",
            "solitaire diamond",
            "diamond only",
            "diamond without setting",
            "diamond wholesale",
            "diamond bulk",
            "diamond individual",
            "diamond single",
            "diamond separate",
            "diamond raw",
            "diamond polished",
            "diamond certified",
            "diamond gia",
            "diamond igi",
            "diamond ssef",
            "diamond grs",
        ],
        "BESPOKE_CVD": [
            # CVD/Lab-grown diamond keywords
            "cvd",
            "lab grown",
            "lab-grown",
            "lab created",
            "lab-created",
            "synthetic diamond",
            "man made",
            "man-made",
            "artificial diamond",
            "cultured diamond",
            "laboratory diamond",
            "lab diamond",
            "created diamond",
            "engineered diamond",
            "grown diamond",
            "cvd diamond",
            "lab grown diamond",
            "lab created diamond",
            "synthetic",
            "laboratory grown",
            "laboratory created",
            "custom cvd",
            "bespoke cvd",
            "cvd jewelry",
            "cvd ring",
            "cvd necklace",
            "cvd earrings",
            "cvd bracelet",
            "cvd pendant",
        ],
        "BESPOKE_NATURAL": [
            # Custom/Bespoke natural jewelry keywords
            "custom",
            "bespoke",
            "handmade",
            "hand made",
            "hand-made",
            "personalized",
            "made to order",
            "tailor made",
            "tailored",
            "custom made",
            "custom design",
            "custom jewelry",
            "custom ring",
            "bespoke jewelry",
            "bespoke ring",
            "bespoke necklace",
            "bespoke earrings",
            "bespoke bracelet",
            "bespoke pendant",
            "handcrafted",
            "hand crafted",
            "artisan",
            "designer",
            "one of a kind",
            "unique design",
            "exclusive design",
            "natural diamond",
            "natural stone",
            "natural gemstone",
            "ruby",
            "emerald",
            "sapphire",
            "natural ruby",
            "natural emerald",
            "natural sapphire",
            "precious stone",
            "semi precious",
            "gemstone jewelry",
            "colored stone",
            "natural colored",
        ],
        "STOCK_JEWELRY": [
            # Ready-made/Stock jewelry keywords (default fallback)
            "ring",
            "necklace",
            "earrings",
            "bracelet",
            "pendant",
            "chain",
            "bangle",
            "anklet",
            "choker",
            "locket",
            "charm",
            "brooch",
            "cufflinks",
            "tie pin",
            "nose ring",
            "toe ring",
            "armlet",
            "gold ring",
            "silver ring",
            "platinum ring",
            "gold necklace",
            "silver necklace",
            "gold bracelet",
            "silver bracelet",
            "gold earrings",
            "silver earrings",
            "gold chain",
            "silver chain",
            "wedding ring",
            "engagement ring",
            "eternity ring",
            "band ring",
            "tennis bracelet",
            "pearl necklace",
            "pearl earrings",
            "diamond ring",
            "diamond necklace",
            "diamond earrings",
            "diamond bracelet",
            "diamond pendant",
            "solitaire ring",
            "cluster ring",
            "halo ring",
            "vintage ring",
            "modern ring",
            "classic ring",
            "traditional ring",
            "contemporary ring",
            "stock jewelry",
            "ready made",
            "ready-made",
            "available",
            "in stock",
            "inventory",
            "catalog",
            "collection",
        ],
    }

    @classmethod
    def detect_order_type(cls, item_name: str) -> str:
        """
        Analyze item name and return the appropriate order type.

        Args:
            item_name: The item name to analyze

        Returns:
            Order type string (LOOSE_DIAMONDS, BESPOKE_CVD, BESPOKE_NATURAL, STOCK_JEWELRY)
        """
        if not item_name:
            return "STOCK_JEWELRY"  # Default fallback

        # Convert to lowercase for case-insensitive matching
        item_lower = item_name.lower().strip()

        # Priority order: Loose Diamonds > CVD > Bespoke Natural > Stock Jewelry
        # This ensures more specific categories are matched first

        # 1. Check for Loose Diamonds (highest priority)
        if cls._contains_keywords(item_lower, cls.KEYWORDS["LOOSE_DIAMONDS"]):
            return "LOOSE_DIAMONDS"

        # 2. Check for CVD/Lab-grown (second priority)
        if cls._contains_keywords(item_lower, cls.KEYWORDS["BESPOKE_CVD"]):
            return "BESPOKE_CVD"

        # 3. Check for Bespoke Natural (third priority)
        if cls._contains_keywords(item_lower, cls.KEYWORDS["BESPOKE_NATURAL"]):
            return "BESPOKE_NATURAL"

        # 4. Default to Stock Jewelry (lowest priority, catches everything else)
        return "STOCK_JEWELRY"

    @classmethod
    def _contains_keywords(cls, text: str, keywords: list) -> bool:
        """
        Check if text contains any of the specified keywords.

        Args:
            text: Text to search in (should be lowercase)
            keywords: List of keywords to search for

        Returns:
            True if any keyword is found, False otherwise
        """
        for keyword in keywords:
            # Use word boundaries to avoid partial matches
            # e.g., "ring" should not match "string"
            pattern = r"\b" + re.escape(keyword.lower()) + r"\b"
            if re.search(pattern, text):
                return True
        return False

    @classmethod
    def get_prefix_for_order_type(cls, order_type: str) -> str:
        """
        Get the Order ID prefix for a given order type.

        Args:
            order_type: Order type string

        Returns:
            Single character prefix (A, B, C, D)
        """
        prefix_mapping = {
            "STOCK_JEWELRY": "A",
            "BESPOKE_NATURAL": "B",
            "BESPOKE_CVD": "C",
            "LOOSE_DIAMONDS": "D",
        }
        return prefix_mapping.get(order_type, "A")

    @classmethod
    def analyze_item_name(cls, item_name: str) -> dict:
        """
        Comprehensive analysis of item name with detailed results.

        Args:
            item_name: The item name to analyze

        Returns:
            Dictionary with analysis results
        """
        order_type = cls.detect_order_type(item_name)
        prefix = cls.get_prefix_for_order_type(order_type)

        # Find which keywords matched
        matched_keywords = []
        if item_name:
            item_lower = item_name.lower().strip()
            for keyword_list in cls.KEYWORDS[order_type]:
                if cls._contains_keywords(item_lower, [keyword_list]):
                    matched_keywords.append(keyword_list)

        return {
            "item_name": item_name,
            "detected_order_type": order_type,
            "order_id_prefix": prefix,
            "matched_keywords": matched_keywords[:5],  # Limit to first 5 matches
            "confidence": "high" if matched_keywords else "default",
        }


# Example usage and testing
if __name__ == "__main__":
    # Test cases
    test_items = [
        "Gold Ring with Diamond",
        "Custom Natural Diamond Engagement Ring",
        "CVD Diamond Tennis Bracelet",
        "Loose Diamond - 2 Carat Round",
        "Bespoke Ruby Necklace Design",
        "Lab Grown Diamond Earrings",
        "Silver Necklace with Pendant",
        "Handmade Natural Emerald Ring",
        "Diamond Stone - Certified GIA",
        "Pearl Earrings Set",
    ]

    print("🔍 Order Type Detection Test Results")
    print("=" * 60)

    for item in test_items:
        result = OrderTypeDetector.analyze_item_name(item)
        print(f"Item: {item}")
        print(f"  → Order Type: {result['detected_order_type']}")
        print(f"  → Prefix: {result['order_id_prefix']}")
        print(f"  → Keywords: {', '.join(result['matched_keywords'][:3])}")
        print()
