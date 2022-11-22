export class ColorMap {

  private colormap = new Map<string, string>();

  private getColor() {
    // TODO:
    // const letters = '0123456789ABCDEF';
    // let color = '';
    // for (var i = 0; i < 6; i++) {
    //   color += letters[Math.floor(Math.random() * 16)];
    // }
    // return color;
    return `${Math.floor(Math.random() * 16777215).toString(16)}`.toUpperCase();
  }

  add(key: string) {
    if (!this.colormap.has(key)) {
      this.colormap.set(key, this.getColor());
    }
    return this.colormap.get(key)
  }

}