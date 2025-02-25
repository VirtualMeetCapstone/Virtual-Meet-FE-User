import { Component } from '@angular/core';

@Component({
  selector: 'app-story-list',
  templateUrl: './story-list.component.html',
  styleUrls: ['./story-list.component.scss']
})
export class StoryListComponent {

  products = [
    { name: 'Story 1', image: 'bamboo-watch.jpg', price: 29.99, inventoryStatus: 'In Stock' },
    { name: 'Story 2', image: 'black-watch.jpg', price: 49.99, inventoryStatus: 'Low Stock' },
    { name: 'Story 3', image: 'blue-band.jpg', price: 19.99, inventoryStatus: 'Out of Stock' },
    { name: 'Story 4', image: 'blue-t-shirt.jpg', price: 24.99, inventoryStatus: 'In Stock' },
    { name: 'Story 5', image: 'bracelet.jpg', price: 15.99, inventoryStatus: 'Low Stock' },
    { name: 'Story 6', image: 'brown-purse.jpg', price: 39.99, inventoryStatus: 'Out of Stock' },
    { name: 'Story 6', image: 'brown-purse.jpg', price: 39.99, inventoryStatus: 'Out of Stock' },
    { name: 'Story 6', image: 'brown-purse.jpg', price: 39.99, inventoryStatus: 'Out of Stock' },
    { name: 'Story 6', image: 'brown-purse.jpg', price: 39.99, inventoryStatus: 'Out of Stock' },
    { name: 'Story 6', image: 'brown-purse.jpg', price: 39.99, inventoryStatus: 'Out of Stock' },
  ];

  responsiveOptions = [
    { breakpoint: '1024px', numVisible: 3, numScroll: 3 },
    { breakpoint: '768px', numVisible: 2, numScroll: 2 },
    { breakpoint: '560px', numVisible: 1, numScroll: 1 }
  ];

  displayDialog = false; // Kiểm soát popup
  selectedProduct: any = null; // Biến để lưu sản phẩm được chọn

  

  getSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (status) {
      case 'In Stock': return 'success';
      case 'Low Stock': return 'warn';
      case 'Out of Stock': return 'danger';
      default: return 'info';
    }
  }

  openDialog(product: any) {
    this.selectedProduct = product;
    this.displayDialog = true;
  }
  
}
