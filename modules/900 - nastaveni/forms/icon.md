o správu ikon v modulu Nastavení 900 -->
<div class="p-4">
<h2 class="text-xl font-semibold mb-4">Přidat novou ikonu</h2>
<form class="space-y-4">
<div>
<label for="key" class="block font-medium">Klíč (např. `calendar`)</label>
<input type="text" id="key" name="key" class="w-full p-2 border rounded" required />
</div>
<div>
<label for="icon" class="block font-medium">Unicode / Emoji (např. 📅)</label>
<input type="text" id="icon" name="icon" class="w-full p-2 border rounded" />
</div>
<div>
<label for="name_cz" class="block font-medium">Název CZ</label>
<input type="text" id="name_cz" name="name_cz" class="w-full p-2 border rounded" required />
</div>
<div>
<label for="name_en" class="block font-medium">Název EN</label>
<input type="text" id="name_en" name="name_en" class="w-full p-2 border rounded" />
</div>
<div>
<label for="category" class="block font-medium">Kategorie</label>
<select id="category" name="category" class="w-full p-2 border rounded">
<option>ZÁKLAD / NAV</option>
<option>CRUD / ACTIONS</option>
<option>COMMUNICATION</option>
<option>BUILDINGS / PROPERTY</option>
<option>CALENDAR / TIME</option>
<option>STATUS / STATE</option>
<option>MAP / GEO</option>
<option>HEALTH / WEATHER / NATURE</option>
<option>TRANSPORT</option>
<option>MEDIA / PLAYER</option>
<option>MISC</option>
<option>E-COMMERCE / FINANCE</option>
</select>
</div>
<div>
<label for="aliases" class="block font-medium">Aliasy (oddělené čárkou)</label>
<input type="text" id="aliases" name="aliases" class="w-full p-2 border rounded" />
</div>
<div>
<label for="svg" class="block font-medium">SVG soubor (volitelné)</label>
<input type="file" id="svg" name="svg" accept=".svg" class="w-full" />
</div>
<div>
<button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">Uložit ikonu</button>
</div>
</form>
</div>
