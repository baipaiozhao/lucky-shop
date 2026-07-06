const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
const ids = ["cmqa9r5dc000aghj929ce2z4e","cmqa9r5de000cghj988sso0fp","cmqa9r5dg000eghj9pfbb2j6z","cmqa9r5dj000gghj96fk307wq","cmqa9r5dl000ighj96bows5ds","cmqa9r5dn000kghj9ug11esd1","cmqa9r5dp000mghj9wnll5fld","cmqa9r5ds000oghj9zgebofwr","cmqa9r5du000qghj98ooqa28b","cmqa9r5dw000sghj9ij0yoh1j","cmqa9r5dy000ughj93hxwuhs6","cmqa9r5e0000wghj9e8hxd1jq","cmqa9r5e2000yghj96rf1v10e","cmqa9r5e50010ghj9k6x01dyv","cmqa9r5e70012ghj9awp6qsbg","cmqa9r5e90014ghj9wvprfn26","cmqa9r5eb0016ghj9c6audc55","cmqa9r5ee0018ghj9pmhvs0mj","cmqa9r5eg001aghj90lzncjpv","cmqa9r5ei001cghj9rfg15utb","cmqa9r5el001eghj9buowhdrw","cmqa9r5en001gghj9s3hr78lo","cmqa9r5ep001ighj913oty3r9","cmqa9r5er001kghj9vpo9tzex"];
const files = ["wireless-earphone.svg","mechanical-keyboard.svg","powerbank.svg","usb-hub.svg","phone-cooler.svg","smartwatch.svg","tshirt.svg","jacket.svg","jeans.svg","sneakers.svg","serum.svg","sunscreen.svg","lipstick.svg","nuts.svg","coffee.svg","chocolate.svg","diffuser.svg","pillow.svg","lamp.svg","js-book.svg","design-book.svg","phone-stand.svg","usb-cable.svg","tote-bag.svg"];
async function main() {
  for (let i = 0; i < ids.length; i++) {
    await p.product.update({ where: { id: ids[i] }, data: { images: JSON.stringify(["/products/" + files[i]]) } });
  }
  process.stdout.write("Updated " + ids.length + " products\n");
  await p.$disconnect();
}
main().catch(e => { process.stderr.write(e.message); process.exit(1); });
