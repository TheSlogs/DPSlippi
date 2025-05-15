import { Component, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { BackendCallsService } from '../backend-calls.service';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-win-rate',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatCheckboxModule],
  templateUrl: './win-rate.component.html',
  styleUrl: './win-rate.component.scss'
})
export class WinRateComponent {

  constructor(private backend: BackendCallsService) {}

  winRateColumns: string[] = [];
  dataSource = new MatTableDataSource<any>([]);
  selectedGroupingsMap: Record<string, boolean> = {
    opp_tag: false,
    character: false,
    opp_character: false,
    stage: false
  };

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit() {
    this.updateWinRates();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    // Custom sorting for numerical columns
    this.dataSource.sortingDataAccessor = (item, property) => {
      if (property === 'win_rate') {
        return Number(item.winRate);
      }
      if (property === 'games_played') {
        return Number(item.gamesPlayed);
      }
      return item[property];
    };
  }

  updateWinRates(): void {
    const groupBy = Object.keys(this.selectedGroupingsMap).filter(key => this.selectedGroupingsMap[key]);
  this.winRateColumns = [...groupBy];

  this.backend.getWinRates(groupBy).subscribe(data => {
    this.dataSource.data = data;
    //console.log('Received data:', data);
    // Re-attach sort and paginator after data update
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  });
  }
}
