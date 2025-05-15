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

interface StatRow {
  id: number;
  startAt: string;
  opp_name: string;
  opp_tag: string;
  character: string;
  opp_character: string;
  stage: string;
  game_duration: string;
  result: number;
}

@Component({
  selector: 'app-stat-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatCheckboxModule
  ],
  templateUrl: './stat-table.component.html',
  styleUrls: ['./stat-table.component.scss']
})
export class StatTableComponent {
  
  // table columns
  displayedColumns: string[] = [
    // 'id',
    'startAt',
    'opp_name',
    'opp_tag',
    'character',
    'opp_character',
    'stage',
    'game_duration',
    'result'
  ];

  @ViewChild(MatSort)
  sort: MatSort = new MatSort;
  dataSource = new MatTableDataSource<StatRow>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;


  filterValues = {
    character: '',
    stage: '',
    opp_tag: ''
  };

  constructor(private backend: BackendCallsService) {}

  ngOnInit() {
    this.backend.statsRefresh$.subscribe(() => {
      this.refreshStats();
    });
    this.refreshStats();
    this.updateWinRates();
  }

  applyFilter() {
    this.refreshStats(); 
  }

  refreshStats() {
    this.backend.getStats(this.filterValues).subscribe(stats => {
      this.dataSource.data = stats;
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }
  setData(data: any[]) {
    this.dataSource.data = data;
  }

  winRateColumns: string[] = [];
  winRates: any[] = [];
  selectedGroupingsMap: Record<string, boolean> = {
    opp_tag: false,
    character: false,
    opp_character: false,
    stage: false
  };
  updateWinRates(): void {
    const groupBy = Object.keys(this.selectedGroupingsMap)
      .filter(key => this.selectedGroupingsMap[key]);

    this.winRateColumns = [...groupBy];

    this.backend.getWinRates(groupBy).subscribe(data => {
      this.winRates = data;
      console.log()
    });
  }

  get hasData(): boolean {
    return this.dataSource.data.length > 0;
  }
}