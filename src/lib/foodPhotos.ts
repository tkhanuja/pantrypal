export function getFoodPhotoFallback(title: string, description?: string): string {
  const cleanTitle = (title || '').toLowerCase();
  const cleanDesc = (description || '').toLowerCase();
  const text = `${cleanTitle} ${cleanDesc}`;

  // Helper to check title first or exact phrase in full text
  const titleHas = (...terms: string[]) => terms.some(t => cleanTitle.includes(t));
  const textHas = (...terms: string[]) => terms.some(t => text.includes(t));

  // 1. Banana Bread / Sweet Loaves (Check title specifically first)
  if (
    titleHas('banana bread', 'banana loaf', 'zucchini bread', 'pumpkin bread', 'apple bread', 'nut bread', 'cinnamon loaf') ||
    (titleHas('banana') && titleHas('bread'))
  ) {
    return 'https://images.unsplash.com/photo-1606851094655-b2593a9af63f?auto=format&fit=crop&w=800&q=80';
  }

  // 2. Pancakes & Waffles
  if (titleHas('pancake', 'pancakes', 'waffle', 'waffles', 'crepe', 'crêpe') || textHas('pancakes', 'waffles')) {
    return 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80';
  }

  // 3. French Toast & Avocado Toast
  if (textHas('french toast')) {
    return 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=800&q=80';
  }
  if (textHas('avocado toast', 'avo toast')) {
    return 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80';
  }

  // 4. Pizza & Calzone
  if (textHas('pizza', 'margherita', 'pepperoni', 'calzone')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80';
  }

  // 5. Burgers & Sliders
  if (textHas('burger', 'cheeseburger', 'slider', 'hamburger')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';
  }

  // 6. Tacos, Burritos, Quesadillas & Mexican
  if (textHas('taco', 'tacos', 'burrito', 'quesadilla', 'fajita', 'enchilada', 'nacho', 'empanada')) {
    return 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80';
  }

  // 7. Sushi & Poke
  if (textHas('sushi', 'sashimi', 'poke bowl', 'poké')) {
    return 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80';
  }

  // 8. Ramen, Udon, Pho, Pad Thai & Asian Noodles
  if (textHas('ramen', 'udon', 'pho', 'pad thai', 'soba', 'chow mein', 'lo mein')) {
    return 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80';
  }

  // 9. Pasta & Lasagna
  if (textHas('lasagna', 'lasagne')) {
    return 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=800&q=80';
  }
  if (textHas('pasta', 'spaghetti', 'penne', 'carbonara', 'fettuccine', 'gnocchi', 'ravioli', 'macaroni', 'rigatoni')) {
    return 'https://images.unsplash.com/photo-1621996346565-e3d5d6281273?auto=format&fit=crop&w=800&q=80';
  }

  // 10. Curries & Tikka Masala
  if (textHas('curry', 'tikka', 'masala', 'dal', 'korma', 'butter chicken', 'vindaloo')) {
    return 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80';
  }

  // 11. Chicken Wings
  if (textHas('wings', 'buffalo wings', 'chicken wings')) {
    return 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80';
  }

  // 12. Chicken & Poultry
  if (textHas('chicken', 'poultry', 'turkey', 'roast chicken', 'chicken thigh', 'chicken breast')) {
    return 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80';
  }

  // 13. Steak, Beef, Pork & Lamb
  if (textHas('steak', 'ribeye', 'sirloin', 'beef', 'meatball', 'brisket', 'ribs', 'pork', 'lamb', 'carnitas')) {
    return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80';
  }

  // 14. Salmon, Fish, Shrimp & Seafood
  if (textHas('salmon', 'fish', 'seafood', 'shrimp', 'prawn', 'tuna', 'cod', 'trout', 'crab', 'lobster', 'scallop')) {
    return 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80';
  }

  // 15. Soups & Broth
  if (textHas('soup', 'broth', 'chowder', 'bisque')) {
    return 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80';
  }

  // 16. Chili & Stew
  if (textHas('chili', 'stew', 'goulash')) {
    return 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80';
  }

  // 17. Sandwiches & Wraps
  if (textHas('sandwich', 'panini', 'sub', 'wrap', 'club sandwich', 'hero')) {
    return 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80';
  }

  // 18. Salads & Greens
  if (textHas('salad', 'caesar', 'greens', 'kale', 'slaw', 'spinach', 'cobb')) {
    return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80';
  }

  // 19. Oatmeal & Porridge
  if (textHas('oatmeal', 'porridge', 'overnight oats', 'granola')) {
    return 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=800&q=80';
  }

  // 20. Eggs & Omelets
  if (textHas('omelet', 'omelette', 'frittata', 'quiche', 'benedict', 'scrambled egg', 'poached egg', 'sunny side')) {
    return 'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=800&q=80';
  }

  // 21. Cookies & Macarons
  if (textHas('cookie', 'cookies', 'biscuit', 'macaron')) {
    return 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80';
  }

  // 22. Brownies
  if (textHas('brownie', 'brownies', 'fudge brownie')) {
    return 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80';
  }

  // 23. Cakes, Cheesecakes, Pies & Tarts
  if (textHas('cheesecake', 'cupcake', 'cake', 'tiramisu', 'tart', 'pie', 'pastry', 'danish')) {
    return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80';
  }

  // 24. Muffins & Scones
  if (textHas('muffin', 'muffins', 'scone', 'scones')) {
    return 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=800&q=80';
  }

  // 25. Smoothies & Shakes
  if (textHas('smoothie', 'shake', 'juice', 'acai')) {
    return 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80';
  }

  // 26. Stir Fry & Teriyaki
  if (textHas('stir fry', 'stir-fry', 'teriyaki')) {
    return 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80';
  }

  // 27. Grain & Buddha Bowls (Only explicit bowl titles or bowl types - NOT generic "in a bowl" text)
  if (textHas('buddha bowl', 'grain bowl', 'quinoa bowl', 'rice bowl', 'poke bowl', 'acai bowl') || cleanTitle.includes('bowl')) {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
  }

  // 28. Breads, Bagels & Sourdough
  if (titleHas('bread', 'loaf', 'sourdough', 'bagel', 'focaccia', 'ciabatta', 'baguette', 'brioche', 'garlic bread')) {
    return 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=800&q=80';
  }

  // 29. Tofu & Veggie Dishes
  if (textHas('tofu', 'tempeh')) {
    return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80';
  }

  // 30. Bacon
  if (textHas('bacon')) {
    return 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?auto=format&fit=crop&w=800&q=80';
  }

  // 31. Default delicious cooked food photo
  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80';
}
