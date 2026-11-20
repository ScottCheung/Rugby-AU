# Player cut-outs

How the transparent images in `public/players/` were made. Not part of the
app's build: run once, by hand, and the results are committed.

1. Download the source photos (free Unsplash licence) into `photos/`.
2. Remove the background with rembg's person model:

   ```bash
   python3 -m venv env && env/bin/pip install "rembg[cpu]==2.0.67" pillow
   env/bin/python cutout.py photos raw
   ```

3. Keep the main figure, frame everyone the same way (head to about the
   waist) and save:

   ```bash
   env/bin/python finish.py raw final p21=taniela-tupou p54=fraser-mcreight ...
   ```

   `name@0:0.45` keeps only part of the frame when other players overlap.

4. Convert to WebP (transparency kept) into `public/players/`.

The photos are of other rugby players, not of the players named on the
cards; the site says so wherever the cards appear.
